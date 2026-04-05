package com.example.backendpos.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.backendpos.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@Slf4j
public class CloudinaryService {
    private final Cloudinary cloudinary;

    @Autowired
    public CloudinaryService(@Autowired(required = false) Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String uploadImage(MultipartFile file) {
        if (cloudinary == null) throw new BadRequestException("Cloudinary is not configured");
        try {
            Map result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "folder", "poscafe/images",
                "resource_type", "image"
            ));
            return (String) result.get("secure_url");
        } catch (IOException e) {
            log.error("Cloudinary image upload failed", e);
            throw new BadRequestException("Image upload failed: " + e.getMessage());
        }
    }

    public String uploadGlb(MultipartFile file) {
        if (cloudinary == null) throw new BadRequestException("Cloudinary is not configured");
        try {
            Map result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "folder", "poscafe/models",
                "resource_type", "raw"
            ));
            return (String) result.get("secure_url");
        } catch (IOException e) {
            log.error("Cloudinary GLB upload failed", e);
            throw new BadRequestException("GLB upload failed: " + e.getMessage());
        }
    }
}
