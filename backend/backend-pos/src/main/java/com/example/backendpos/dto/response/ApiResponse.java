package com.example.backendpos.dto.response;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonInclude;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder().success(true).message("Success").data(data).build();
    }
    public static <T> ApiResponse<T> ok(String msg, T data) {
        return ApiResponse.<T>builder().success(true).message(msg).data(data).build();
    }
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder().success(false).message(message).build();
    }
}
