const upload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "Vipinyadav");
    formData.append("cloud_name", "vipinyadav01");

    try {
        const response = await fetch("https://api.cloudinary.com/v1_1/vipinyadav01/image/upload", {
            method: "POST",
            body: formData,
        });

        const data = await response.json();
        if (response.ok) {
            return data.secure_url;
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
};

export default upload;
