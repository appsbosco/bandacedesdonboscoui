import { gql, useMutation } from "@apollo/client";
import curved9 from "assets/images/curved-images/curved-6.jpg";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import CoverLayout from "layouts/authentication/components/CoverLayout";
import InputField from "layouts/authentication/components/InputField";
import MultiStepForm, { FormStep } from "layouts/authentication/components/MultiStepForm";
import { useState } from "react";
import * as yup from "yup";

const validationSchema = yup.object().shape({
  identification: yup.string().required("Campo obligatorio"),
  sex: yup.string().required("Campo obligatorio"),
  bloodType: yup.string().required("Campo obligatorio"),
  address: yup.string().required("Campo obligatorio"),
  familyMemberName: yup.string().required("Campo obligatorio"),
  familyMemberNumber: yup.string().required("Campo obligatorio"),
  familyMemberNumberId: yup.string().required("Campo obligatorio"),
  familyMemberRelationship: yup.string().required("Campo obligatorio"),
  illness: yup.array().of(yup.string().required()),
  medicine: yup.array().of(yup.string().required()),
  medicineOnTour: yup.array().of(yup.string().required()),
  vaccinated: yup.string(),
  vaccineNumber: yup.number().positive().integer(),
  vaccineManufacturer: yup.string(),
});

const NEW_MEDICAL_RECORD = gql`
  mutation NewMedicalRecord($input: MedicalRecordInput!) {
    newMedicalRecord(input: $input) {
      id
      identification
      sex
      bloodType
      address
      familyMemberName
      familyMemberNumber
      familyMemberNumberId
      familyMemberRelationship
      illness
      medicine
      medicineOnTour
      vaccinated
      vaccineNumber
      vaccineManufacturer
      user
    }
  }
`;

const MedicalRecordForm = () => {
  const [newMedicalRecord] = useMutation(NEW_MEDICAL_RECORD);

  const [message, setMessage] = useState(null);

  const showMessage = () => {
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "10px",
          margin: "10px auto",
          maxWidth: "300px",
          textAlign: "center",
          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        <p>{message}</p>
      </div>
    );
  };

  return (
    <CoverLayout
      title="Ficha Médica"
      description="Ingrese los datos de la ficha médica"
      image={curved9}
    >
      {message && showMessage()}

      <MultiStepForm
        initialValues={{
          identification: "",
          sex: "",
          bloodType: "",
          address: "",
          familyMemberName: "",
          familyMemberNumber: "",
          familyMemberNumberId: "",
          familyMemberRelationship: "",
          illness: [],
          medicine: [],
          medicineOnTour: [],
          vaccinated: "",
          vaccineNumber: 0,
          vaccineManufacturer: "",
        }}
        onSubmit={async (values) => {
          try {
            const { data } = await newMedicalRecord({
              variables: {
                input: values,
              },
            });
            setMessage(`Se creó correctamente la ficha médica con ID: ${data.newMedicalRecord.id}`);
          } catch (error) {
            setMessage(error.message.replace("GraphQL error: ", ""));
          }
        }}
      >
        <FormStep
          stepName="Información Personal"
          onSubmit={() => console.log("Step 1")}
          validationSchema={validationSchema}
        >
          <SoftBox component="form" role="form">
            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Identificación
                </SoftTypography>
              </SoftBox>
              <InputField name="identification" placeholder="Identificación" />
            </SoftBox>
            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Sexo
                </SoftTypography>
              </SoftBox>
              <InputField name="sex" placeholder="Sexo" />
            </SoftBox>
            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Tipo de Sangre
                </SoftTypography>
              </SoftBox>
              <InputField name="bloodType" placeholder="Tipo de Sangre" />
            </SoftBox>
            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Dirección
                </SoftTypography>
              </SoftBox>
              <InputField name="address" placeholder="Dirección" />
            </SoftBox>
            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Nombre del Familiar
                </SoftTypography>
              </SoftBox>
              <InputField name="familyMemberName" placeholder="Nombre del Familiar" />
            </SoftBox>
            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Número del Familiar
                </SoftTypography>
              </SoftBox>
              <InputField name="familyMemberNumber" placeholder="Número del Familiar" />
            </SoftBox>
            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Cédula del Familiar
                </SoftTypography>
              </SoftBox>
              <InputField name="familyMemberNumberId" placeholder="Cédula del Familiar" />
            </SoftBox>
            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Parentesco del Familiar
                </SoftTypography>
              </SoftBox>
              <InputField name="familyMemberRelationship" placeholder="Parentesco del Familiar" />
            </SoftBox>
          </SoftBox>
        </FormStep>

        <FormStep
          stepName="Información Médica"
          onSubmit={() => console.log("Step 2")}
          validationSchema={validationSchema}
        >
          <SoftBox component="form" role="form">
            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Enfermedades
                </SoftTypography>
              </SoftBox>
              <InputField name="illness" placeholder="Enfermedades" multiple />
            </SoftBox>
            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Medicamentos
                </SoftTypography>
              </SoftBox>
              <InputField name="medicine" placeholder="Medicamentos" multiple />
            </SoftBox>
            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Medicamentos en Giras de la Banda
                </SoftTypography>
              </SoftBox>
              <InputField
                name="medicineOnTour"
                placeholder="Medicamentos en Giras de la Banda"
                multiple
              />
            </SoftBox>
            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Vacunado
                </SoftTypography>
              </SoftBox>
              <InputField name="vaccinated" placeholder="Vacunado" />
            </SoftBox>
            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Número de Vacuna
                </SoftTypography>
              </SoftBox>
              <InputField type="number" name="vaccineNumber" placeholder="Número de Vacuna" />
            </SoftBox>
            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Fabricante de la Vacuna
                </SoftTypography>
              </SoftBox>
              <InputField name="vaccineManufacturer" placeholder="Fabricante de la Vacuna" />
            </SoftBox>
          </SoftBox>
        </FormStep>
      </MultiStepForm>
    </CoverLayout>
  );
};

export default MedicalRecordForm;
