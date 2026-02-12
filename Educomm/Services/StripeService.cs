using Stripe;
using Stripe.Checkout;

namespace Educomm.Services
{
    public class StripeService : IStripeService
    {
        public Task<Session> CreateCheckoutSessionAsync(SessionCreateOptions options)
        {
            var service = new SessionService();
            return service.CreateAsync(options);
        }

        public Event ConstructEvent(string json, string stripeSignature, string webhookSecret)
        {
            return EventUtility.ConstructEvent(json, stripeSignature, webhookSecret);
        }

        public Task<Session> GetSessionAsync(string sessionId)
        {
            var service = new SessionService();
            return service.GetAsync(sessionId);
        }
    }
}
