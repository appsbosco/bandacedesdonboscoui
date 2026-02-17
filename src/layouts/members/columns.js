export const musiciansColumns = [
  { field: "identification", headerName: "Cédula", width: 180 },
  { field: "state", headerName: "Estado", width: 180 },
  { field: "name", headerName: "Nombre", width: 180 },
  { field: "firstSurName", headerName: "Primer Apellido", width: 200 },
  { field: "secondSurName", headerName: "Segundo Apellido", width: 200 },
  { field: "instrument", headerName: "Sección", width: 120 },
  { field: "age", headerName: "Edad", width: 80 },
  { field: "birthday", headerName: "Año de nacimiento", width: 200 },
  { field: "email", headerName: "Correo", width: 300 },
  { field: "phone", headerName: "Phone", width: 120 },
];

export const staffColumns = [
  { field: "name", headerName: "Nombre", width: 200 },
  { field: "firstSurName", headerName: "Primer Apellido", width: 200 },
  { field: "secondSurName", headerName: "Segundo Apellido", width: 250 },
  { field: "email", headerName: "Correo", width: 300 },
  { field: "role", headerName: "Rol", width: 220 },
];

export const parentsColumns = [
  { field: "name", headerName: "Nombre", width: 200 },
  { field: "firstSurName", headerName: "Primer Apellido", width: 200 },
  { field: "secondSurName", headerName: "Segundo Apellido", width: 250 },
  { field: "email", headerName: "Correo", width: 300 },
  { field: "role", headerName: "Rol", width: 200 },
  { field: "phone", headerName: "Número", width: 200 },
  {
    field: "childrenNames",
    headerName: "Hijo/a",
    width: 300,
    valueGetter: (params) => {
      const children = params.row.children || [];
      const childNames = children
        .map((child) => `${child.name} ${child.firstSurName} ${child.secondSurName}`)
        .join(", ");
      return childNames;
    },
  },
  {
    field: "childrenInstuemtn",
    headerName: "Sección",
    width: 300,
    valueGetter: (params) => {
      const children = params.row.children || [];
      const childNames = children.map((child) => `${child.instrument}`).join(", ");
      return childNames;
    },
  },
];
