package com.pclab.hardware.ai.model;

@FunctionalInterface
public interface AiUsageBudget {

    boolean reserve(int estimatedTokens);
}
