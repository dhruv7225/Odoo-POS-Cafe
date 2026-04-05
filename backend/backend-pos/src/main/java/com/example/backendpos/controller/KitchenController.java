package com.example.backendpos.controller;

import com.example.backendpos.dto.response.*;
import com.example.backendpos.service.KitchenService;
import com.example.backendpos.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/kitchen")
@RequiredArgsConstructor
public class KitchenController {
    private final KitchenService kitchenService;

    @GetMapping("/tickets/active/{restaurantId}")
    @PreAuthorize("hasAnyRole('CHEF','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<List<KitchenTicketResponse>>> getActive(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(ApiResponse.ok(kitchenService.getActiveTickets(restaurantId)));
    }

    @GetMapping("/tickets/all/{restaurantId}")
    @PreAuthorize("hasAnyRole('CHEF','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<List<KitchenTicketResponse>>> getAll(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(ApiResponse.ok(kitchenService.getAllTickets(restaurantId)));
    }

    @GetMapping("/tickets/{ticketId}")
    @PreAuthorize("hasAnyRole('CHEF','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<KitchenTicketResponse>> getTicket(@PathVariable Long ticketId) {
        return ResponseEntity.ok(ApiResponse.ok(kitchenService.getTicket(ticketId)));
    }

    @PatchMapping("/tickets/{ticketId}/start")
    @PreAuthorize("hasRole('CHEF')")
    public ResponseEntity<ApiResponse<KitchenTicketResponse>> startPreparing(@PathVariable Long ticketId) {
        return ResponseEntity.ok(ApiResponse.ok("Preparing started", kitchenService.startPreparing(ticketId, SecurityUtil.getCurrentUserId())));
    }

    @PatchMapping("/items/{itemId}/prepared")
    @PreAuthorize("hasRole('CHEF')")
    public ResponseEntity<ApiResponse<KitchenTicketResponse>> markItemPrepared(@PathVariable Long itemId) {
        return ResponseEntity.ok(ApiResponse.ok("Item marked prepared", kitchenService.markItemPrepared(itemId)));
    }

    @PatchMapping("/tickets/{ticketId}/complete")
    @PreAuthorize("hasRole('CHEF')")
    public ResponseEntity<ApiResponse<KitchenTicketResponse>> completeTicket(@PathVariable Long ticketId) {
        return ResponseEntity.ok(ApiResponse.ok("Ticket completed", kitchenService.completeTicket(ticketId)));
    }
}
