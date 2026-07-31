package com.pclab.hardware.storage;

import com.pclab.hardware.config.StorageProperties;
import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ModelStorageService {

    private static final long MAX_FILE_SIZE_BYTES = 100L * 1024L * 1024L;
    private static final byte[] GLB_MAGIC = {'g', 'l', 'T', 'F'};

    private final Path modelRoot;
    private final String publicPrefix;

    @Autowired
    public ModelStorageService(StorageProperties properties) {
        this(Path.of(properties.getModelRoot()), properties.getPublicPrefix());
    }

    public ModelStorageService(Path modelRoot, String publicPrefix) {
        this.modelRoot = modelRoot.toAbsolutePath().normalize();
        this.publicPrefix = publicPrefix.endsWith("/")
                ? publicPrefix.substring(0, publicPrefix.length() - 1)
                : publicPrefix;
    }

    public StoredModel store(MultipartFile file) {
        validate(file);
        String fileName = UUID.randomUUID() + ".glb";
        Path target = modelRoot.resolve(fileName).normalize();
        if (!target.startsWith(modelRoot)) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "模型文件名不合法");
        }
        Path temporary = modelRoot.resolve(fileName + ".uploading").normalize();
        try {
            Files.createDirectories(modelRoot);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (InputStream input = new DigestInputStream(file.getInputStream(), digest)) {
                Files.copy(input, temporary);
            }
            moveAtomically(temporary, target);
            return new StoredModel(
                    fileName,
                    publicPrefix + "/" + fileName,
                    Files.size(target),
                    HexFormat.of().formatHex(digest.digest())
            );
        } catch (IOException | NoSuchAlgorithmException exception) {
            deleteQuietly(temporary);
            throw new DomainException(ErrorCode.STORAGE_ERROR);
        }
    }

    public Path modelRoot() {
        return modelRoot;
    }

    private static void validate(MultipartFile file) {
        String originalName = file.getOriginalFilename();
        if (file.isEmpty() || file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "GLB 文件大小必须在 1B–100MB");
        }
        if (originalName == null || !originalName.toLowerCase(Locale.ROOT).endsWith(".glb")) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "仅支持 .glb 模型文件");
        }
        try (InputStream input = file.getInputStream()) {
            byte[] magic = input.readNBytes(GLB_MAGIC.length);
            if (!java.util.Arrays.equals(magic, GLB_MAGIC)) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED, "文件不是有效的 GLB");
            }
        } catch (IOException exception) {
            throw new DomainException(ErrorCode.STORAGE_ERROR);
        }
    }

    private static void moveAtomically(Path source, Path target) throws IOException {
        try {
            Files.move(
                    source,
                    target,
                    StandardCopyOption.ATOMIC_MOVE,
                    StandardCopyOption.REPLACE_EXISTING
            );
        } catch (AtomicMoveNotSupportedException exception) {
            Files.move(source, target, StandardCopyOption.REPLACE_EXISTING);
        }
    }

    private static void deleteQuietly(Path path) {
        try {
            Files.deleteIfExists(path);
        } catch (IOException ignored) {
            // The original storage failure remains the actionable error.
        }
    }

    public record StoredModel(
            String fileName,
            String publicUrl,
            long fileSizeBytes,
            String checksumSha256
    ) {
    }
}
