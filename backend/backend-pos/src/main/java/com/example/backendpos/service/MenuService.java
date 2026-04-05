package com.example.backendpos.service;

import com.example.backendpos.dto.request.*;
import com.example.backendpos.entity.Category;
import com.example.backendpos.entity.PaymentMethod;
import com.example.backendpos.entity.Product;

import java.util.List;

public interface MenuService {
    Category createCategory(CategoryRequest request);
    Category updateCategory(Long id, CategoryRequest request);
    List<Category> getCategories(Long restaurantId);
    void deactivateCategory(Long id);
    Product createProduct(ProductRequest request);
    Product updateProduct(Long id, ProductRequest request);
    List<Product> getProducts(Long restaurantId);
    List<Product> getProductsByCategory(Long categoryId);
    void deactivateProduct(Long id);
    // Variants
    ProductVariant addVariant(Long productId, String name, java.math.BigDecimal priceAdjustment);
    ProductVariant updateVariant(Long variantId, String name, java.math.BigDecimal priceAdjustment);
    void deleteVariant(Long variantId);
    List<ProductVariant> getVariants(Long productId);
    // Toppings
    ProductTopping addTopping(Long productId, String name, java.math.BigDecimal price);
    ProductTopping updateTopping(Long toppingId, String name, java.math.BigDecimal price);
    void deleteTopping(Long toppingId);
    List<ProductTopping> getToppings(Long productId);
    // Payment Methods
    PaymentMethod createPaymentMethod(PaymentMethodRequest request);
    PaymentMethod updatePaymentMethod(Long id, PaymentMethodRequest request);
    List<PaymentMethod> getPaymentMethods(Long restaurantId);
    void togglePaymentMethod(Long id);
}
