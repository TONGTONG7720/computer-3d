package com.pclab.hardware.ai.rag;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.pclab.hardware.ai.entity.AiKnowledgeDocumentEntity;
import com.pclab.hardware.ai.mapper.AiKnowledgeDocumentMapper;
import com.pclab.hardware.utils.SearchNormalizer;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Transactional(readOnly = true)
public class MySqlKnowledgeRetriever implements KnowledgeRetriever {

    private static final int EXCERPT_LIMIT = 240;

    private final AiKnowledgeDocumentMapper mapper;

    public MySqlKnowledgeRetriever(AiKnowledgeDocumentMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public List<AiKnowledgeEvidence> retrieve(KnowledgeQuery query) {
        List<String> terms = Arrays.stream(query.text().split("\\s+"))
                .map(SearchNormalizer::normalize)
                .filter(term -> !term.isBlank())
                .distinct()
                .toList();
        return mapper.selectList(
                        Wrappers.<AiKnowledgeDocumentEntity>lambdaQuery()
                                .eq(AiKnowledgeDocumentEntity::getStatus, "ACTIVE")
                                .orderByDesc(AiKnowledgeDocumentEntity::getUpdatedAt)
                ).stream()
                .map(document -> rank(document, terms))
                .filter(ranked -> ranked.score() > 0)
                .sorted(Comparator.comparingDouble(RankedDocument::score).reversed())
                .limit(query.limit())
                .map(RankedDocument::evidence)
                .toList();
    }

    private static RankedDocument rank(
            AiKnowledgeDocumentEntity document,
            List<String> terms
    ) {
        String haystack = SearchNormalizer.normalize(
                document.getTitle() + " "
                        + document.getCategory() + " "
                        + document.getContent() + " "
                        + document.getTagsJson()
        );
        long matches = terms.stream().filter(haystack::contains).count();
        double score = terms.isEmpty() ? 0 : matches / (double) terms.size();
        return new RankedDocument(
                new AiKnowledgeEvidence(
                        document.getDocumentKey(),
                        document.getTitle(),
                        excerpt(document.getContent()),
                        score,
                        document.getVersion()
                ),
                score
        );
    }

    private static String excerpt(String content) {
        return content.length() <= EXCERPT_LIMIT
                ? content
                : content.substring(0, EXCERPT_LIMIT) + "…";
    }

    private record RankedDocument(AiKnowledgeEvidence evidence, double score) {
    }
}
