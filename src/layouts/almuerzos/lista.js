import React from "react";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { GET_ORDERS } from "graphql/queries";
import { useQuery } from "@apollo/client";

const formatDateString = (dateString) => {
  const date = new Date(parseInt(dateString));
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

const ListaAlmuerzos = () => {
  const { loading, error, data } = useQuery(GET_ORDERS);

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error :(</p>;

  const totalOrders = data.orders.length;

  // Calcular el monto total de todas las órdenes
  const totalAmount = data.orders.reduce((acc, order) => {
    const orderTotal = order.products.reduce(
      (acc, product) => acc + product.productId.price * product.quantity,
      0
    );
    return acc + orderTotal;
  }, 0);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="p-6 page-content">
        <div className="flex items-center justify-between w-full mb-6">
          <h4 className="text-xl font-medium">Lista de pedidos</h4>
        </div>
        <div className="grid  gap-6">
          <div className="xl:col-span-9">
            <div className="space-y-6">
              <div className="grid lg:grid-cols-3 sm:grid-cols-2 gap-6">
                <div className="border rounded-lg p-6 overflow-hidden border-default-200">
                  <div className="flex items-center gap-4">
                    <div className="inline-flex items-center justify-center rounded-full bg-primary/20 text-primary h-16 w-16">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        data-lucide="banknote"
                        className="lucide lucide-banknote h-8 w-8"
                      >
                        <rect width="20" height="12" x="2" y="6" rx="2"></rect>
                        <circle cx="12" cy="12" r="2"></circle>
                        <path d="M6 12h.01M18 12h.01"></path>
                      </svg>
                    </div>
                    <div className="">
                      <p className="text-base text-default-500 font-medium mb-1">
                        Total de pedidos
                      </p>
                      <h4 className="text-2xl text-default-950 font-semibold mb-2">
                        {totalOrders}
                      </h4>
                    </div>
                  </div>
                </div>
                <div className="border rounded-lg p-6 overflow-hidden border-default-200">
                  <div className="flex items-center gap-4">
                    <div className="inline-flex items-center justify-center rounded-full bg-yellow-500/20 text-yellow-500 h-16 w-16">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        data-lucide="wallet"
                        className="lucide lucide-wallet h-8 w-8"
                      >
                        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
                        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
                        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-base text-default-500 font-medium mb-1">Monto recaudado</p>
                      <h4 className="text-2xl text-default-950 font-semibold mb-2">
                        ₡{totalAmount.toFixed(2)}
                      </h4>
                    </div>
                  </div>
                </div>
                <div className="border rounded-lg p-6 overflow-hidden border-default-200">
                  <div className="flex items-center gap-4">
                    <div className="inline-flex items-center justify-center rounded-full bg-green-500/20 text-green-500 h-16 w-16">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        data-lucide="star"
                        className="lucide lucide-star h-8 w-8 fill-green-500"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                    </div>
                    <div className="">
                      <p className="text-base text-default-500 font-medium mb-1">Pagado</p>
                      <h4 className="text-2xl text-default-950 font-semibold mb-2">98%</h4>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1">
                <div className="border rounded-lg border-default-200">
                  <div className="p-6 overflow-hidden ">
                    <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
                      <h2 className="text-xl text-default-800 font-semibold">Historial</h2>

                      <div className="flex items-center">
                        <span className="text-base text-default-950 me-3">Filtrar por :</span>
                        <div className="hs-dropdown relative inline-flex [--placement:bottom-right]">
                          <button
                            type="button"
                            className="hs-dropdown-toggle flex items-center gap-2 font-medium text-default-950 text-sm py-2.5 px-4 xl:px-5 rounded-full border border-default-200 transition-all"
                          >
                            Todos{" "}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              data-lucide="chevron-down"
                              className="lucide lucide-chevron-down h-4 w-4"
                            >
                              <path d="m6 9 6 6 6-6"></path>
                            </svg>
                          </button>

                          <div className="hs-dropdown-menu hs-dropdown-open:opacity-100 min-w-[200px] transition-[opacity,margin] mt-4 opacity-0 hidden z-20 bg-white dark:bg-default-50 shadow-[rgba(17,_17,_26,_0.1)_0px_0px_16px] rounded-lg border border-default-100 p-1.5">
                            <ul className="flex flex-col gap-1">
                              <li>
                                <a
                                  className="flex items-center gap-3 font-normal py-2 px-3 transition-all text-default-700 bg-default-400/20 rounded"
                                  href="javascript:void(0)"
                                >
                                  All
                                </a>
                              </li>
                              <li>
                                <a
                                  className="flex items-center gap-3 font-normal text-default-600 py-2 px-3 transition-all hover:text-default-700 hover:bg-default-400/20 rounded"
                                  href="javascript:void(0)"
                                >
                                  Refund
                                </a>
                              </li>
                              <li>
                                <a
                                  className="flex items-center gap-3 font-normal text-default-600 py-2 px-3 transition-all hover:text-default-700 hover:bg-default-400/20 rounded"
                                  href="javascript:void(0)"
                                >
                                  Paid
                                </a>
                              </li>
                              <li>
                                <a
                                  className="flex items-center gap-3 font-normal text-default-600 py-2 px-3 transition-all hover:text-default-700 hover:bg-default-400/20 rounded"
                                  href="javascript:void(0)"
                                >
                                  Cancel
                                </a>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative overflow-x-auto">
                    <div className="min-w-full inline-block align-middle">
                      <div className="overflow-hidden">
                        <table className="min-w-full divide-y divide-default-200">
                          <thead className="bg-default-100">
                            <tr className="text-start">
                              <th className="px-6 py-3 text-start text-sm whitespace-nowrap font-medium text-default-800">
                                Fecha
                              </th>
                              <th className="px-6 py-3 text-start text-sm whitespace-nowrap font-medium text-default-800">
                                Nombre completo
                              </th>
                              <th className="px-6 py-3 text-start text-sm whitespace-nowrap font-medium text-default-800 min-w">
                                Pedidos
                              </th>
                              <th className="px-6 py-3 text-start text-sm whitespace-nowrap font-medium text-default-800">
                                Total
                              </th>
                              {/* <th className="px-6 py-3 text-start text-sm whitespace-nowrap font-medium text-default-800 min-w-[10rem]">
                                Status
                              </th> */}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-default-200">
                            {data?.orders?.map((order) => (
                              <tr key={order.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-default-500">
                                  {formatDateString(order.orderDate)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-default-500">
                                  {order.userId.name +
                                    " " +
                                    order.userId.firstSurName +
                                    " " +
                                    order.userId.secondSurName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-default-800">
                                  <div className="flex items-center gap-4">
                                    <div className="grow">
                                      <div className="flex items-center gap-2">
                                        <div className="flex gap-1.5">
                                          {order.products.map((product, index) => (
                                            <span key={product.productId.id}>
                                              {product.productId.name} ({product.quantity})
                                              {index < order.products.length - 1 ? ", " : ""}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-default-500">
                                  ₡{" "}
                                  {order.products
                                    .reduce(
                                      (acc, curr) => acc + curr.productId.price * curr.quantity,
                                      0
                                    )
                                    .toFixed(2)}
                                </td>
                                {/* <td className="px-6 py-4">
                                  <span className="inline-flex items-center gap-1 py-1 px-4 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-500">
                                    Refund
                                  </span>
                                </td> */}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </DashboardLayout>
  );
};

export default ListaAlmuerzos;
