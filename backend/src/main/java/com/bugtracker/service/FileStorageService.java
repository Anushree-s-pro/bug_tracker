package com.bugtracker.service;

import com.bugtracker.exception.BadRequestException;
import com.bugtracker.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_TYPES = Set.of("image/png", "image/jpeg", "image/gif", "image/webp");

    private final Path root;

    public FileStorageService(@Value("${app.upload-dir}") String dir) throws IOException {
        this.root = Paths.get(dir).toAbsolutePath().normalize();
        Files.createDirectories(root);
    }

    /** Validates and stores the image, returns the generated file name. */
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new BadRequestException("No file selected");
        String type = file.getContentType();
        if (type == null || !ALLOWED_TYPES.contains(type.toLowerCase())) {
            throw new BadRequestException("Only PNG, JPEG, GIF or WEBP images are allowed");
        }
        String ext = switch (type.toLowerCase()) {
            case "image/png" -> ".png";
            case "image/gif" -> ".gif";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
        String name = UUID.randomUUID() + ext;
        try {
            Files.copy(file.getInputStream(), root.resolve(name), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new BadRequestException("Could not store file");
        }
        return name;
    }

    public Resource load(String name) {
        try {
            Path p = root.resolve(name).normalize();
            if (!p.startsWith(root) || !Files.exists(p)) throw new ResourceNotFoundException("File not found");
            return new UrlResource(p.toUri());
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("File not found");
        }
    }

    public void delete(String name) {
        if (name == null) return;
        try {
            Path p = root.resolve(name).normalize();
            if (p.startsWith(root)) Files.deleteIfExists(p);
        } catch (IOException ignored) {
        }
    }
}
