package com.educollab.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

@Configuration
public class S3Config {

    @Value("${app.aws.access-key}")
    private String accessKey;

    @Value("${app.aws.secret-key}")
    private String secretKey;

    @Value("${app.aws.region}")
    private String region;

    @Value("${app.aws.endpoint:}")
    private String endpoint;

    @Bean
    public S3Client s3Client() {
        System.out.println(">>> S3 ENDPOINT = [" + endpoint + "]");

        var builder = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(
                    StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)
                    )
                );

        if (endpoint != null && !endpoint.isBlank()) {
            System.out.println(">>> Using MinIO at: " + endpoint);
            builder
                .endpointOverride(URI.create(endpoint))
                .serviceConfiguration(
                    S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build()
                );
        } else {
            System.out.println(">>> WARNING: No endpoint — using real AWS S3!");
        }

        return builder.build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        var builder = S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(
                    StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)
                    )
                );

        if (endpoint != null && !endpoint.isBlank()) {
            builder.endpointOverride(URI.create(endpoint));
        }

        return builder.build();
    }
}
