package com.pclab.hardware.config;

import com.pclab.hardware.security.AdminKeyInterceptor;
import com.pclab.hardware.security.RateLimitInterceptor;
import com.pclab.hardware.security.RequestTraceFilter;
import com.pclab.hardware.security.SecurityProperties;
import java.nio.file.Path;
import java.util.List;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableConfigurationProperties({
    CorsProperties.class,
    StorageProperties.class,
    SecurityProperties.class
})
public class WebConfig implements WebMvcConfigurer {

    private final CorsProperties corsProperties;
    private final StorageProperties storageProperties;
    private final RateLimitInterceptor rateLimitInterceptor;
    private final AdminKeyInterceptor adminKeyInterceptor;

    public WebConfig(
            CorsProperties corsProperties,
            StorageProperties storageProperties,
            ObjectProvider<RateLimitInterceptor> rateLimitInterceptor,
            ObjectProvider<AdminKeyInterceptor> adminKeyInterceptor
    ) {
        this.corsProperties = corsProperties;
        this.storageProperties = storageProperties;
        this.rateLimitInterceptor = rateLimitInterceptor.getIfAvailable();
        this.adminKeyInterceptor = adminKeyInterceptor.getIfAvailable();
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        if (rateLimitInterceptor != null) {
            registry.addInterceptor(rateLimitInterceptor)
                    .addPathPatterns("/api/**");
        }
        if (adminKeyInterceptor != null) {
            registry.addInterceptor(adminKeyInterceptor)
                    .addPathPatterns("/api/admin/**");
        }
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        List<String> origins = corsProperties.originList();
        registry.addMapping("/api/**")
                .allowedOrigins(origins.toArray(String[]::new))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("Content-Type", "X-Admin-Key", RequestTraceFilter.TRACE_HEADER)
                .exposedHeaders(RequestTraceFilter.TRACE_HEADER)
                .maxAge(3600);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String prefix = storageProperties.getPublicPrefix();
        String resourcePattern = prefix.endsWith("/") ? prefix + "**" : prefix + "/**";
        String location = Path.of(storageProperties.getModelRoot())
                .toAbsolutePath()
                .normalize()
                .toUri()
                .toString();
        if (!location.endsWith("/")) {
            location += "/";
        }
        registry.addResourceHandler(resourcePattern).addResourceLocations(location);
    }
}
