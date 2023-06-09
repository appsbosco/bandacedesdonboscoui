import React, { useState } from "react";
import { useMutation, gql, useQuery } from "@apollo/client";

const GET_USERS_BY_ID = gql`
  query getUser {
    getUser {
      id
      name
      firstSurName
      secondSurName
      email
      birthday
      carnet
      state
      grade
      phone
      role
      instrument
      avatar
    }
  }
`;
const UPLOAD_PROFILE_PIC = gql`
  mutation UploadProfilePic($id: ID!, $avatar: String!) {
    uploadProfilePic(id: $id, avatar: $avatar) {
      id
      avatar
    }
  }
`;

const ProfileImageUploader = () => {
  const [uploadProfilePic] = useMutation(UPLOAD_PROFILE_PIC);
  const [selectedImage, setSelectedImage] = useState(null);
  const { data, loading, error, refetch } = useQuery(GET_USERS_BY_ID);
  const { id } = data?.getUser || {};

  const uploadImageToCloudinary = async (image) => {
    const data = new FormData();
    data.append("file", image);
    data.append("upload_preset", "dn5llzqm"); // Set your Cloudinary upload preset
    data.append("cloud_name", "dnv9akklf"); // Set your Cloudinary cloud name

    const response = await fetch("https://api.cloudinary.com/v1_1/dnv9akklf/image/upload", {
      method: "POST",
      body: data,
    });

    const responseData = await response.json();
    return responseData.url;
  };

  const handleImageChange = async (e) => {
    if (e.target.files[0]) {
      try {
        const imageUrl = await uploadImageToCloudinary(e.target.files[0]);

        console.log("imageUrl", imageUrl);
        const { data } = await uploadProfilePic({
          variables: { id, avatar: imageUrl },
        });

        console.log("UPDATED DATA", data);

        const updatedUserAvatar = data.uploadProfilePic.avatar;
        setSelectedImage(updatedUserAvatar);
      } catch (error) {
        console.error("Error uploading profile picture:", error);
      }
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error.message}</p>;
  }

  return (
    <div
      className="w-20 h-20 rounded"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
      }}
    >
      <label
        htmlFor="imageInput"
        style={{
          display: "inline-block",
          width: "2rem",
          height: "2rem",
          textAlign: "center",
          cursor: "pointer",
        }}
      >
        +
        <input
          id="imageInput"
          type="file"
          style={{ display: "none" }}
          onChange={handleImageChange}
        />
      </label>
    </div>
  );
};

export default ProfileImageUploader;
