package com.pclab.hardware.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.storage")
public class StorageProperties {

    private String modelRoot = "./storage/models";
    private String publicPrefix = "/assets/models";

    public String getModelRoot() {
        return modelRoot;
    }

    public void setModelRoot(String modelRoot) {
        this.modelRoot = modelRoot;
    }

    public String getPublicPrefix() {
        return publicPrefix;
    }

    public void setPublicPrefix(String publicPrefix) {
        this.publicPrefix = publicPrefix;
    }
}
