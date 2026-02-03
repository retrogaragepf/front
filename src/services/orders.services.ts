const APIURL = process.env.NEXT_PUBLIC_API_URL;

export const createOrder = async (products: number[], token: string) => {
  try {
    const res = await fetch(`${APIURL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ products }),
    });
    const orders = await res.json();
    return orders;
  } catch (error) {
    throw new Error(error as string);
  }
};

export const getAllOrders = async (token: string) => {
  try {
    const res = await fetch(`${APIURL}/users/orders`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });
    const orders = await res.json();
    return orders;
  } catch (error) {
    throw new Error(error as string);
  }
};
