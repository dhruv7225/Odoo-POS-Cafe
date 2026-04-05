package com.example.backendpos.service;

import com.example.backendpos.dto.response.KitchenTicketResponse;

import java.util.List;

public interface KitchenService {
    KitchenTicketResponse getTicket(Long ticketId);
    List<KitchenTicketResponse> getActiveTickets(Long restaurantId);
    List<KitchenTicketResponse> getAllTickets(Long restaurantId);
    KitchenTicketResponse startPreparing(Long ticketId, Long chefId);
    KitchenTicketResponse markItemPrepared(Long ticketItemId);
    KitchenTicketResponse completeTicket(Long ticketId);
}
