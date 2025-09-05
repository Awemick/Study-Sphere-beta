import { supabase } from './supabase.js'

export const PAYSTACK_PUBLIC_KEY = 'pk_test_cb64b5939626d35004e38687f833c332bcaa4051';

export const paymentService = {
  async initializePayment(email, amount, metadata = {}) {
    // Validate inputs
    if (!PAYSTACK_PUBLIC_KEY || !PAYSTACK_PUBLIC_KEY.startsWith('pk_')) {
      throw new Error('Invalid Paystack API key configuration');
    }

    if (!email || !amount || amount <= 0) {
      throw new Error('Invalid payment parameters');
    }

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
          callback_url: `${window.location.origin}/?payment=verify`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid Paystack API key. Please check your key in the Paystack dashboard.');
        } else if (response.status === 400) {
          throw new Error('Invalid payment request. Please check your payment details.');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please try again later.');
        } else {
          throw new Error(`Payment service error: ${data.message || 'Unknown error'}`);
        }
      }

      if (!data.status) {
        throw new Error(data.message || 'Payment initialization failed');
      }

      return data.data;
    } catch (error) {
      console.error('Payment initialization error:', error);
      throw error; // Re-throw the specific error
    }
  },

  async initializePaymentSupabase(email, amount, metadata = {}) {
    // Validate inputs
    if (!email || !amount || amount <= 0) {
      throw new Error('Invalid payment parameters');
    }

    try {
      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token || null;

      const FUNCTION_URL = 'https://pklaygtgyryexuyykvtf.supabase.co/functions/v1/index-ts';

      const payload = {
        email,
        amount, // Send in dollars as expected by the function
        metadata,
        callback_url: `${window.location.origin}/?payment=verify`
      };

      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Supabase function failed:', {
          status: res.status,
          statusText: res.statusText,
          responseData: data
        });
        throw new Error(`Supabase function error: ${data.error || data.message || 'Unknown error'}`);
      }

      console.log('Supabase payment initialization response:', data);

      // Return in the same format as Paystack for compatibility
      return {
        authorization_url: data.authorization_url
      };
    } catch (error) {
      console.error('Supabase payment initialization error:', error);
      throw error;
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
      const paymentData = await this.initializePaymentSupabase(
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