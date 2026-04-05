package com.example.backendpos.service.impl;

import com.example.backendpos.dto.response.KitchenTicketResponse;
import com.example.backendpos.dto.response.KitchenTicketResponse.KitchenItemResponse;
import com.example.backendpos.entity.KitchenTicket;
import com.example.backendpos.entity.KitchenTicketItem;
import com.example.backendpos.entity.Order;
import com.example.backendpos.entity.User;
import com.example.backendpos.enums.ItemStatus;
import com.example.backendpos.enums.OrderStatus;
import com.example.backendpos.enums.PrepStatus;
import com.example.backendpos.enums.TicketStatus;
import com.example.backendpos.exception.BadRequestException;
import com.example.backendpos.exception.ResourceNotFoundException;
import com.example.backendpos.repository.*;
import com.example.backendpos.service.KitchenNotificationService;
import com.example.backendpos.service.KitchenService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class KitchenServiceImpl implements KitchenService {
    private final KitchenTicketRepository ticketRepository;
    private final KitchenTicketItemRepository ticketItemRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final KitchenNotificationService kitchenNotificationService;

    @Override
    @Transactional(readOnly = true)
    public KitchenTicketResponse getTicket(Long ticketId) {
        KitchenTicket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new ResourceNotFoundException("KitchenTicket", "id", ticketId));
        return toResponse(ticket);
    }

    @Override
    @Transactional(readOnly = true)
    public List<KitchenTicketResponse> getActiveTickets(Long restaurantId) {
        // Returns TO_COOK + PREPARING + COMPLETED-but-not-yet-picked-up (order still READY)
        return ticketRepository.findKitchenDisplayTickets(restaurantId)
            .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<KitchenTicketResponse> getAllTickets(Long restaurantId) {
        return ticketRepository.findByRestaurantIdOrderBySentAtDesc(restaurantId)
            .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public KitchenTicketResponse startPreparing(Long ticketId, Long chefId) {
        KitchenTicket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new ResourceNotFoundException("KitchenTicket", "id", ticketId));
        if (ticket.getTicketStatus() != TicketStatus.TO_COOK)
            throw new BadRequestException("Ticket must be in TO_COOK status to start preparing");

        User chef = userRepository.findById(chefId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", chefId));

        ticket.setChef(chef);
        ticket.setTicketStatus(TicketStatus.PREPARING);
        ticket.setStartedAt(LocalDateTime.now());

        // Mark all items as preparing
        ticket.getTicketItems().forEach(item -> {
            item.setPrepStatus(PrepStatus.PREPARING);
            item.getOrderItem().setItemStatus(ItemStatus.PREPARING);
            orderItemRepository.save(item.getOrderItem());
        });
        ticketItemRepository.saveAll(ticket.getTicketItems());

        KitchenTicketResponse response = toResponse(ticketRepository.save(ticket));
        kitchenNotificationService.notifyTicketUpdate(ticket.getRestaurant().getId(), response);
        kitchenNotificationService.notifyOrderStatusChange(
            ticket.getRestaurant().getId(), ticket.getOrder().getId(),
            ticket.getOrder().getOrderNo(), "PREPARING");
        return response;
    }

    @Override
    @Transactional
    public KitchenTicketResponse markItemPrepared(Long ticketItemId) {
        KitchenTicketItem item = ticketItemRepository.findById(ticketItemId)
            .orElseThrow(() -> new ResourceNotFoundException("KitchenTicketItem", "id", ticketItemId));
        if (item.getPrepStatus() == PrepStatus.COMPLETED)
            throw new BadRequestException("Item is already completed");

        item.setPrepStatus(PrepStatus.COMPLETED);
        item.setPreparedAt(LocalDateTime.now());
        item.getOrderItem().setItemStatus(ItemStatus.COMPLETED);
        orderItemRepository.save(item.getOrderItem());
        ticketItemRepository.save(item);

        // Check if all items in the ticket are completed
        KitchenTicket ticket = item.getKitchenTicket();
        List<KitchenTicketItem> allItems = ticketItemRepository.findByKitchenTicketId(ticket.getId());
        boolean allDone = allItems.stream().allMatch(i -> i.getPrepStatus() == PrepStatus.COMPLETED);
        if (allDone) {
            ticket.setTicketStatus(TicketStatus.COMPLETED);
            ticket.setCompletedAt(LocalDateTime.now());
            ticketRepository.save(ticket);
            // Mark order as READY
            Order order = ticket.getOrder();
            order.setStatus(OrderStatus.READY);
            orderRepository.save(order);
            kitchenNotificationService.notifyOrderReady(
                ticket.getRestaurant().getId(), order.getId(), order.getOrderNo());
        }

        KitchenTicketResponse response = toResponse(ticket);
        kitchenNotificationService.notifyTicketUpdate(ticket.getRestaurant().getId(), response);
        return response;
    }

    @Override
    @Transactional
    public KitchenTicketResponse completeTicket(Long ticketId) {
        KitchenTicket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new ResourceNotFoundException("KitchenTicket", "id", ticketId));
        if (ticket.getTicketStatus() == TicketStatus.COMPLETED)
            throw new BadRequestException("Ticket is already completed");

        ticket.setTicketStatus(TicketStatus.COMPLETED);
        ticket.setCompletedAt(LocalDateTime.now());
        ticket.getTicketItems().forEach(item -> {
            item.setPrepStatus(PrepStatus.COMPLETED);
            item.setPreparedAt(LocalDateTime.now());
            item.getOrderItem().setItemStatus(ItemStatus.COMPLETED);
            orderItemRepository.save(item.getOrderItem());
        });
        ticketItemRepository.saveAll(ticket.getTicketItems());

        Order order = ticket.getOrder();
        order.setStatus(OrderStatus.READY);
        orderRepository.save(order);

        KitchenTicketResponse response = toResponse(ticketRepository.save(ticket));
        kitchenNotificationService.notifyTicketUpdate(ticket.getRestaurant().getId(), response);
        kitchenNotificationService.notifyOrderReady(
            ticket.getRestaurant().getId(), order.getId(), order.getOrderNo());
        kitchenNotificationService.notifyOrderStatusChange(
            ticket.getRestaurant().getId(), order.getId(), order.getOrderNo(), "READY");
        return response;
    }

    private KitchenTicketResponse toResponse(KitchenTicket t) {
        List<KitchenItemResponse> items = t.getTicketItems().stream().map(i ->
            KitchenItemResponse.builder()
                .id(i.getId())
                .productName(i.getOrderItem().getProduct().getName())
                .qty(i.getOrderItem().getQty())
                .prepStatus(i.getPrepStatus().name())
                .preparedAt(i.getPreparedAt()).build()
        ).toList();

        return KitchenTicketResponse.builder()
            .id(t.getId()).orderId(t.getOrder().getId()).orderNo(t.getOrder().getOrderNo())
            .tableNo(t.getOrder().getTable() != null ? t.getOrder().getTable().getTableNo() : null)
            .chefName(t.getChef() != null ? t.getChef().getFullName() : null)
            .ticketStatus(t.getTicketStatus().name())
            .sentAt(t.getSentAt()).startedAt(t.getStartedAt()).completedAt(t.getCompletedAt())
            .items(items).build();
    }
}
