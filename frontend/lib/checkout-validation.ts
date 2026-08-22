export type CheckoutValidationForm = {
  fullName: string;
  email: string;
  phone: string;
  house: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
};

export function validateCheckoutContact(form: Pick<CheckoutValidationForm, "email" | "phone">) {
  return /^\S+@\S+\.\S+$/.test(form.email) && /^\+?[0-9\s-]{10,15}$/.test(form.phone);
}

export function validateCheckoutShipping(
  form: Pick<CheckoutValidationForm, "fullName" | "house" | "area" | "city" | "state" | "pincode">
) {
  return Boolean(
    form.fullName &&
      form.house &&
      form.area &&
      form.city &&
      form.state &&
      /^\d{6}$/.test(form.pincode)
  );
}

export function getCheckoutValidationMessage(form: CheckoutValidationForm, acceptedTerms: boolean) {
  if (!validateCheckoutContact(form)) {
    return "Please add your contact information.";
  }

  if (!validateCheckoutShipping(form)) {
    return "Please complete all shipping details.";
  }

  if (!acceptedTerms) {
    return "Please accept the terms before payment.";
  }

  return "";
}
