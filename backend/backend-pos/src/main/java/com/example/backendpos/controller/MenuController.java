package com.example.backendpos.controller;

import com.example.backendpos.dto.request.*;
import com.example.backendpos.dto.response.ApiResponse;
import com.example.backendpos.entity.*;
import com.example.backendpos.service.MenuService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MenuController {
    private final MenuService menuService;

    // ========== Categories ==========
    @PostMapping("/categories")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Category>> createCategory(@Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(menuService.createCategory(request)));
    }

    @PutMapping("/categories/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Category>> updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(menuService.updateCategory(id, request)));
    }

    @GetMapping("/categories/restaurant/{restaurantId}")
    public ResponseEntity<ApiResponse<List<Category>>> getCategories(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(ApiResponse.ok(menuService.getCategories(restaurantId)));
    }

    @DeleteMapping("/categories/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deactivateCategory(@PathVariable Long id) {
        menuService.deactivateCategory(id);
        return ResponseEntity.ok(ApiResponse.ok("Category deactivated", null));
    }

    // ========== Products ==========
    @PostMapping("/products")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Product>> createProduct(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(menuService.createProduct(request)));
    }

    @PutMapping("/products/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Product>> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(menuService.updateProduct(id, request)));
    }

    @GetMapping("/products/restaurant/{restaurantId}")
    public ResponseEntity<ApiResponse<List<Product>>> getProducts(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(ApiResponse.ok(menuService.getProducts(restaurantId)));
    }

    @GetMapping("/products/category/{categoryId}")
    public ResponseEntity<ApiResponse<List<Product>>> getProductsByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(ApiResponse.ok(menuService.getProductsByCategory(categoryId)));
    }

    @DeleteMapping("/products/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deactivateProduct(@PathVariable Long id) {
        menuService.deactivateProduct(id);
        return ResponseEntity.ok(ApiResponse.ok("Product deactivated", null));
    }

    // ========== Variants ==========
    @PostMapping("/products/{productId}/variants")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<ProductVariant>> addVariant(@PathVariable Long productId, @Valid @RequestBody VariantRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(menuService.addVariant(productId, request.getName(), request.getPriceAdjustment())));
    }

    @PutMapping("/variants/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<ProductVariant>> updateVariant(@PathVariable Long id, @Valid @RequestBody VariantRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(menuService.updateVariant(id, request.getName(), request.getPriceAdjustment())));
    }

    @DeleteMapping("/variants/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteVariant(@PathVariable Long id) {
        menuService.deleteVariant(id);
        return ResponseEntity.ok(ApiResponse.ok("Variant deactivated", null));
    }

    @GetMapping("/products/{productId}/variants")
    public ResponseEntity<ApiResponse<List<ProductVariant>>> getVariants(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.ok(menuService.getVariants(productId)));
    }

    // ========== Toppings ==========
    @PostMapping("/products/{productId}/toppings")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<ProductTopping>> addTopping(@PathVariable Long productId, @Valid @RequestBody ToppingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(menuService.addTopping(productId, request.getName(), request.getPrice())));
    }

    @PutMapping("/toppings/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<ProductTopping>> updateTopping(@PathVariable Long id, @Valid @RequestBody ToppingRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(menuService.updateTopping(id, request.getName(), request.getPrice())));
    }

    @DeleteMapping("/toppings/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteTopping(@PathVariable Long id) {
        menuService.deleteTopping(id);
        return ResponseEntity.ok(ApiResponse.ok("Topping deactivated", null));
    }

    @GetMapping("/products/{productId}/toppings")
    public ResponseEntity<ApiResponse<List<ProductTopping>>> getToppings(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.ok(menuService.getToppings(productId)));
    }

    // ========== Payment Methods ==========
    @PostMapping("/payment-methods")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<PaymentMethod>> createPaymentMethod(@Valid @RequestBody PaymentMethodRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(menuService.createPaymentMethod(request)));
    }

    @PutMapping("/payment-methods/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<PaymentMethod>> updatePaymentMethod(@PathVariable Long id, @Valid @RequestBody PaymentMethodRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(menuService.updatePaymentMethod(id, request)));
    }

    @GetMapping("/payment-methods/restaurant/{restaurantId}")
    public ResponseEntity<ApiResponse<List<PaymentMethod>>> getPaymentMethods(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(ApiResponse.ok(menuService.getPaymentMethods(restaurantId)));
    }

    @PatchMapping("/payment-methods/{id}/toggle")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> togglePaymentMethod(@PathVariable Long id) {
        menuService.togglePaymentMethod(id);
        return ResponseEntity.ok(ApiResponse.ok("Payment method toggled", null));
    }
}
