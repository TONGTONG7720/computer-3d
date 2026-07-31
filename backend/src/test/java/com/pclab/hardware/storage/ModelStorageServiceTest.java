package com.pclab.hardware.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

class ModelStorageServiceTest {

    @TempDir
    private Path modelDirectory;

    @Test
    void storesValidatedGlbWithGeneratedName() throws Exception {
        Object service = createService();
        Method store = service.getClass().getMethod("store", MultipartFile.class);
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "rtx5090.glb",
                "model/gltf-binary",
                new byte[]{'g', 'l', 'T', 'F', 2, 0, 0, 0}
        );

        Object stored = store.invoke(service, file);
        String fileName = (String) stored.getClass().getMethod("fileName").invoke(stored);
        String publicUrl = (String) stored.getClass().getMethod("publicUrl").invoke(stored);
        String checksum = (String) stored.getClass().getMethod("checksumSha256").invoke(stored);

        assertThat(fileName).endsWith(".glb");
        assertThat(publicUrl).isEqualTo("/assets/models/" + fileName);
        assertThat(checksum).hasSize(64);
        assertThat(Files.readAllBytes(modelDirectory.resolve(fileName)))
                .containsExactly(file.getBytes());
    }

    private Object createService() throws ReflectiveOperationException {
        Class<?> serviceType;
        try {
            serviceType = Class.forName("com.pclab.hardware.storage.ModelStorageService");
        } catch (ClassNotFoundException exception) {
            fail("ModelStorageService is not implemented", exception);
            return new Object();
        }
        Constructor<?> constructor = serviceType.getConstructor(Path.class, String.class);
        return constructor.newInstance(modelDirectory, "/assets/models");
    }
}
