import Purchases from "@revenuecat/purchases-js";

class RevenueCatService {
  constructor() {
    this.isInitialized = false;
    this.currentUserId = null;
  }

  async initialize(appUserId = null) {
    if (this.isInitialized && this.currentUserId === appUserId) {
      return;
    }

    try {
      await Purchases.configure("YOUR_REVENUECAT_API_KEY", appUserId);
      this.isInitialized = true;
      this.currentUserId = appUserId;
      console.log('RevenueCat initialized with user:', appUserId);
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  async checkEntitlements() {
    if (!this.isInitialized) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      const customerInfo = await Purchases.getSharedInstance().getCustomerInfo();
      return {
        isPro: customerInfo.entitlements.active["pro"] !== undefined,
        isEnterprise: customerInfo.entitlements.active["enterprise"] !== undefined,
        customerInfo
      };
    } catch (error) {
      console.error('RevenueCat entitlement check error:', error);
      return {
        isPro: false,
        isEnterprise: false,
        customerInfo: null
      };
    }
  }

  async getOfferings() {
    if (!this.isInitialized) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      const offerings = await Purchases.getSharedInstance().getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('Failed to get offerings:', error);
      throw error;
    }
  }

  async purchasePackage(packageToPurchase) {
    if (!this.isInitialized) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      const { customerInfo } = await Purchases.getSharedInstance().purchase({ 
        rcPackage: packageToPurchase 
      });
      
      return {
        isPro: customerInfo.entitlements.active["pro"] !== undefined,
        isEnterprise: customerInfo.entitlements.active["enterprise"] !== undefined,
        customerInfo
      };
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  async restorePurchases() {
    if (!this.isInitialized) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      const customerInfo = await Purchases.getSharedInstance().restorePurchases();
      return {
        isPro: customerInfo.entitlements.active["pro"] !== undefined,
        isEnterprise: customerInfo.entitlements.active["enterprise"] !== undefined,
        customerInfo
      };
    } catch (error) {
      console.error('Restore purchases failed:', error);
      throw error;
    }
  }

  async logout() {
    if (!this.isInitialized) {
      return;
    }

    try {
      await Purchases.getSharedInstance().logOut();
      this.currentUserId = null;
    } catch (error) {
      console.error('RevenueCat logout failed:', error);
    }
  }
}

export default new RevenueCatService();