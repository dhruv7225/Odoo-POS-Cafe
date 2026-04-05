package com.example.backendpos.service.impl;

import com.example.backendpos.dto.request.*;
import com.example.backendpos.entity.Category;
import com.example.backendpos.entity.PaymentMethod;
import com.example.backendpos.entity.Product;
import com.example.backendpos.entity.Restaurant;
import com.example.backendpos.exception.BadRequestException;
import com.example.backendpos.exception.ConflictException;
import com.example.backendpos.exception.ResourceNotFoundException;
import com.example.backendpos.repository.*;
import com.example.backendpos.service.MenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MenuServiceImpl implements MenuService {
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductToppingRepository toppingRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final RestaurantRepository restaurantRepository;

    // ========== Categories ==========

    @Override @Transactional
    public Category createCategory(CategoryRequest request) {
        Restaurant r = restaurantRepository.findById(request.getRestaurantId())
            .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", request.getRestaurantId()));
        return categoryRepository.save(Category.builder().restaurant(r).name(request.getName()).build());
    }

    @Override @Transactional
    public Category updateCategory(Long id, CategoryRequest request) {
        Category c = categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        c.setName(request.getName());
        return categoryRepository.save(c);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Category> getCategories(Long restaurantId) {
        return categoryRepository.findByRestaurantIdAndActiveTrue(restaurantId);
    }

    @Override @Transactional
    public void deactivateCategory(Long id) {
        Category c = categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        c.setActive(false);
        categoryRepository.save(c);
    }

    // ========== Products ==========

    @Override @Transactional
    public Product createProduct(ProductRequest request) {
        Restaurant r = restaurantRepository.findById(request.getRestaurantId())
            .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", request.getRestaurantId()));
        Category c = categoryRepository.findById(request.getCategoryId())
            .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
        if (!c.getRestaurant().getId().equals(r.getId())) {
            throw new BadRequestException("Category does not belong to this restaurant");
        }
        return productRepository.save(Product.builder()
            .restaurant(r).category(c).name(request.getName())
            .price(request.getPrice()).taxRate(request.getTaxRate())
            .kitchenEnabled(request.getKitchenEnabled())
            .description(request.getDescription())
            .imageUrl(request.getImageUrl())
            .glbUrl(request.getGlbUrl()).build());
    }

    @Override @Transactional
    public Product updateProduct(Long id, ProductRequest request) {
        Product p = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        p.setName(request.getName());
        p.setPrice(request.getPrice());
        p.setTaxRate(request.getTaxRate());
        if (request.getImageUrl() != null) p.setImageUrl(request.getImageUrl());
        if (request.getGlbUrl() != null) p.setGlbUrl(request.getGlbUrl());
        p.setKitchenEnabled(request.getKitchenEnabled());
        p.setDescription(request.getDescription());
        return productRepository.save(p);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Product> getProducts(Long restaurantId) {
        return productRepository.findByRestaurantIdAndActiveTrue(restaurantId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Product> getProductsByCategory(Long categoryId) {
        return productRepository.findByCategoryIdAndActiveTrue(categoryId);
    }

    @Override @Transactional
    public void deactivateProduct(Long id) {
        Product p = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        p.setActive(false);
        productRepository.save(p);
    }

    // ========== Variants ==========

    @Override @Transactional
    public ProductVariant addVariant(Long productId, String name, BigDecimal priceAdjustment) {
        Product p = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        return variantRepository.save(ProductVariant.builder()
            .product(p).name(name).priceAdjustment(priceAdjustment).build());
    }

    @Override @Transactional
    public ProductVariant updateVariant(Long variantId, String name, BigDecimal priceAdjustment) {
        ProductVariant v = variantRepository.findById(variantId)
            .orElseThrow(() -> new ResourceNotFoundException("Variant", "id", variantId));
        v.setName(name);
        v.setPriceAdjustment(priceAdjustment);
        return variantRepository.save(v);
    }

    @Override @Transactional
    public void deleteVariant(Long variantId) {
        ProductVariant v = variantRepository.findById(variantId)
            .orElseThrow(() -> new ResourceNotFoundException("Variant", "id", variantId));
        v.setActive(false);
        variantRepository.save(v);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductVariant> getVariants(Long productId) {
        return variantRepository.findByProductIdAndActiveTrue(productId);
    }

    // ========== Toppings ==========

    @Override @Transactional
    public ProductTopping addTopping(Long productId, String name, BigDecimal price) {
        Product p = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        return toppingRepository.save(ProductTopping.builder()
            .product(p).name(name).price(price).build());
    }

    @Override @Transactional
    public ProductTopping updateTopping(Long toppingId, String name, BigDecimal price) {
        ProductTopping t = toppingRepository.findById(toppingId)
            .orElseThrow(() -> new ResourceNotFoundException("Topping", "id", toppingId));
        t.setName(name);
        t.setPrice(price);
        return toppingRepository.save(t);
    }

    @Override @Transactional
    public void deleteTopping(Long toppingId) {
        ProductTopping t = toppingRepository.findById(toppingId)
            .orElseThrow(() -> new ResourceNotFoundException("Topping", "id", toppingId));
        t.setActive(false);
        toppingRepository.save(t);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductTopping> getToppings(Long productId) {
        return toppingRepository.findByProductIdAndActiveTrue(productId);
    }

    // ========== Payment Methods ==========

    @Override @Transactional
    public PaymentMethod createPaymentMethod(PaymentMethodRequest request) {
        Restaurant r = restaurantRepository.findById(request.getRestaurantId())
            .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", request.getRestaurantId()));
        paymentMethodRepository.findByRestaurantIdAndCode(r.getId(), request.getCode())
            .ifPresent(pm -> { throw new ConflictException("Payment method code already exists: " + request.getCode()); });
        return paymentMethodRepository.save(PaymentMethod.builder()
            .restaurant(r).name(request.getName()).code(request.getCode())
            .requiresReference(request.getRequiresReference())
            .upiId(request.getUpiId()).build());
    }

    @Override @Transactional
    public PaymentMethod updatePaymentMethod(Long id, PaymentMethodRequest request) {
        PaymentMethod pm = paymentMethodRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("PaymentMethod", "id", id));
        pm.setName(request.getName());
        pm.setRequiresReference(request.getRequiresReference());
        pm.setUpiId(request.getUpiId());
        return paymentMethodRepository.save(pm);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentMethod> getPaymentMethods(Long restaurantId) {
        return paymentMethodRepository.findByRestaurantIdAndActiveTrue(restaurantId);
    }

    @Override @Transactional
    public void togglePaymentMethod(Long id) {
        PaymentMethod pm = paymentMethodRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("PaymentMethod", "id", id));
        pm.setActive(!pm.getActive());
        paymentMethodRepository.save(pm);
    }
}
