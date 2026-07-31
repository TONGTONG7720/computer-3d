package com.pclab.hardware.ai.model;

import java.util.List;

@FunctionalInterface
public interface AiEmbeddingGateway {

    List<Double> embed(String text);
}
