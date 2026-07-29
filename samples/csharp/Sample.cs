namespace DarkSharp.Samples;

public enum OrderStatus { Pending, Shipped, Delivered, Cancelled }

public record OrderLine(string Sku, int Quantity, decimal UnitPrice)
{
    public decimal Total => Quantity * UnitPrice;
}

public interface IOrderRepository
{
    Task<IReadOnlyList<Order>> GetByStatusAsync(OrderStatus status, CancellationToken ct = default);
}

public class Order
{
    public required Guid Id { get; init; }
    public required string Customer { get; set; }
    public OrderStatus Status { get; private set; } = OrderStatus.Pending;
    public List<OrderLine> Lines { get; } = [];

    public decimal GrandTotal => Lines.Sum(line => line.Total);

    public void Advance() => Status = Status switch
    {
        OrderStatus.Pending => OrderStatus.Shipped,
        OrderStatus.Shipped => OrderStatus.Delivered,
        var other => other,
    };
}

public class OrderService(IOrderRepository repository)
{
    private const decimal FreeShippingThreshold = 50m;

    public async Task<decimal> OutstandingRevenueAsync(CancellationToken ct)
    {
        var pending = await repository.GetByStatusAsync(OrderStatus.Pending, ct);
        return pending
            .Where(order => order.GrandTotal > FreeShippingThreshold)
            .Sum(order => order.GrandTotal);
    }
}
