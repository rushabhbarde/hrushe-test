const serializeAddress = (address) => ({
  id: address._id?.toString?.() || address.id || "",
  label: address.label || "Home",
  fullName: address.fullName || "",
  mobile: address.mobile || "",
  pincode: address.pincode || "",
  city: address.city || "",
  state: address.state || "",
  house: address.house || "",
  area: address.area || "",
  landmark: address.landmark || "",
  isDefault: Boolean(address.isDefault),
});

const serializeUser = (user) => ({
  id: user._id?.toString?.() || user.id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  address: user.address || "",
  gender: user.gender || "",
  dateOfBirth: user.dateOfBirth || null,
  profilePictureUrl: user.profilePictureUrl || "",
  role: user.role,
  addresses: Array.isArray(user.addresses) ? user.addresses.map(serializeAddress) : [],
  preferences: {
    preferredSize: user.preferences?.preferredSize || "",
    preferredFit: user.preferences?.preferredFit || "",
    favoriteColors: Array.isArray(user.preferences?.favoriteColors)
      ? user.preferences.favoriteColors
      : [],
  },
  communicationPreferences: {
    emailNotifications:
      user.communicationPreferences?.emailNotifications !== false,
    whatsappOrderUpdates:
      user.communicationPreferences?.whatsappOrderUpdates !== false,
    marketingMessages: Boolean(user.communicationPreferences?.marketingMessages),
  },
  wishlistCount: Array.isArray(user.wishlist) ? user.wishlist.length : 0,
});

module.exports = {
  serializeAddress,
  serializeUser,
};
