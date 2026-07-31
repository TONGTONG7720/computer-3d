package com.pclab.hardware;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@EnableCaching
@SpringBootApplication
public class HardwarePlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(HardwarePlatformApplication.class, args);
    }
}
