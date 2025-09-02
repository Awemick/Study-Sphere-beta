const PAYSTACK_PUBLIC_KEY = 'pk_test_c8085f6e5ec5f58ab4146937afe3daf700003bfe';

export const paymentService = {
  async initializePayment(email, amount, metadata = {}) {
    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_PUBLIC_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          amount: amount * 100, // Convert to kobo
          metadata,
          callback_url: `${window.location.origin}/payment-verification.html`
        })
      });
      
      const data = await response.json();
      
      if (!data.status) {
        throw new Error(data.message);
      }
      
      return data.data;
    } catch (error) {
      console.error('Payment initialization error:', error);
      throw new Error('Failed to initialize payment');
    }
  },
  
  async verifyPayment(reference) {
    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${PAYSTACK_PUBLIC_KEY}`
        }
      });
      
      const data = await response.json();
      
      if (!data.status) {
        throw new Error(data.message);
      }
      
      return data.data;
    } catch (error) {
      console.error('Payment verification error:', error);
      throw new Error('Failed to verify payment');
    }
  },
  
  async handlePremiumUpgrade(userId, planType = 'monthly') {
    try {
      // Get user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const amount = planType === 'monthly' ? 900 : 1900; // $9 or $19
      const paymentData = await this.initializePayment(
        user.email, 
        amount, 
        { userId, planType }
      );
      
      // Redirect to payment page
      window.location.href = paymentData.authorization_url;
    } catch (error) {
      console.error('Premium upgrade error:', error);
      throw error;
    }
  }
};

// Handle payment verification callback
export function handlePaymentCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const reference = urlParams.get('reference');
  
  if (reference) {
    paymentService.verifyPayment(reference)
      .then(data => {
        if (data.status === 'success') {
          // Update user premium status in Supabase
          const userId = data.metadata.userId;
          
          supabase
            .from('profiles')
            .update({ 
              is_premium: true,
              premium_expires_at: getPremiumExpiryDate(data.metadata.planType)
            })
            .eq('id', userId)
            .then(({ error }) => {
              if (error) {
                console.error('Error updating premium status:', error);
                alert('Payment verified but there was an error activating your premium account. Please contact support.');
              } else {
                alert('Payment successful! Your premium account has been activated.');
                window.location.href = '/';
              }
            });
        }
      })
      .catch(error => {
        console.error('Payment verification failed:', error);
        alert('Payment verification failed. Please contact support.');
      });
  }
}

function getPremiumExpiryDate(planType) {
  const expiryDate = new Date();
  
  if (planType === 'monthly') {
    expiryDate.setMonth(expiryDate.getMonth() + 1);
  } else {
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  }
  
  return expiryDate.toISOString();
}