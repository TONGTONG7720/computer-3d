package com.pclab.hardware.price.service;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.cache.annotation.CacheEvict;

@CacheEvict(
        cacheNames = {
                "prices",
                "price-comparison",
                "price-history",
                "price-build",
                "price-admin"
        },
        allEntries = true
)
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface PriceCacheEviction {
}
