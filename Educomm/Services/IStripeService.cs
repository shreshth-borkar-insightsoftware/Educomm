using Stripe;
using Stripe.Checkout;

namespace Educomm.Services
{
    public interface IStripeService
    {
        Task<Session> CreateCheckoutSessionAsync(SessionCreateOptions options);
        Event ConstructEvent(string json, string stripeSignature, string webhookSecret);
        Task<Session> GetSessionAsync(string sessionId);
    }
}
