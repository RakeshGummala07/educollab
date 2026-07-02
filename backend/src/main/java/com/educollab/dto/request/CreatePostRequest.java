package com.educollab.dto.request;

import com.educollab.document.Post;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class CreatePostRequest {

    @NotBlank(message = "Post content cannot be empty")
    @Size(max = 2000, message = "Post content must be under 2000 characters")
    private String content;

    private Post.PostType type = Post.PostType.TEXT;

    // URLs already uploaded to S3
    private List<MediaAttachmentDto> mediaAttachments;

    @Data
    public static class MediaAttachmentDto {
        private String url;
        private String type;           // "image" or "video"
        private String originalName;
        private Long size;
    }
}
