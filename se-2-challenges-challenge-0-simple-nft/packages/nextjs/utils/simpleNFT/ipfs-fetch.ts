import axios from 'axios';

export const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIzOWY1MjFkYi0zYzU5LTQxYTctYWJjOS0zM2RlYjk3Yjg1N2QiLCJlbWFpbCI6IjE5ODEzNDcwOThAcXEuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siaWQiOiJGUkExIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9LHsiaWQiOiJOWUMxIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImVkYTcxZDU4OTEzMWVkZDVlNDU0Iiwic2NvcGVkS2V5U2VjcmV0IjoiMzUyODVhNzJmZTIwYmU1ZTZlMDE1ZmU1OTVkMmM2YWI0OGMyNGZjZDNiNzY5ZGQ1Zjc2OWM4MWFmOTBiMzQ2NCIsImlhdCI6MTcxNzM3Nzc0M30.MKBiBCvhUKgcOtVkMRM2ROSkoKaq52k7WwqmKXCPwUs';

const token = 'ZjEvJDx0DPjUwIoczxpyuXDVkoWWcvWyTSDKrSpeeg5ZvWFzF-pYbHWZKENWQom9';




const fetchFromApi = async ({ path, method, body }: { path: string; method: string; body?: object }) => {
  const formData = new FormData();

  // 将body转换为JSON字符串，然后创建一个Blob对象
  const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
  formData.append('file', blob, 'Contract.json'); // 添加文件到formData

  try {
    return await axios({
      method,
      url: path,
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      data: formData,
    });
  } catch (error) {
    console.error(error);
  }
};

export const uploadFile = async (file: File): Promise<any> => {
  try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
          headers: {
              Authorization: `Bearer ${jwt}`,
          },
      }).catch((err)=>{
          console.log("上传失败",err);
      });

      return response;
  } catch {
      return "上传失败";
  }
};

// 上传文件夹并返回文件 URL 数组
export const uploadFolderToIPFS = async (files: File[]): Promise<string[]> => {
  const ipfsUrls: string[] = [];

  try {
      const formData = new FormData();

      // 将所有文件添加到 FormData 中
      files.forEach((file) => {
          formData.append("file", file, file.name); // 保留文件名
      });

      // 上传文件夹到 IPFS
      const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
          headers: {
              Authorization: `Bearer ${jwt}`,
          },
      });

      if (response.data && response.data.IpfsHash) {
          const folderHash = response.data.IpfsHash;

          // 拼接每个文件的完整 IPFS URL
          files.forEach((file) => {
              const fileUrl = `https://ipfs.io/ipfs/${folderHash}/${file.name}`;
              ipfsUrls.push(fileUrl);
          });

          console.log("Folder uploaded to IPFS:", `https://ipfs.io/ipfs/${folderHash}/`);
          console.log("IPFS URLs:", ipfsUrls);
          return ipfsUrls;
      } else {
          throw new Error("Failed to upload folder to IPFS");
      }
  } catch (error) {
      console.error("Error uploading folder to IPFS:", error);
      throw error;
  }
};

// 上传单个文件到 IPFS 并返回 URL 数组
export const uploadFilesToIPFS = async (files: File[]): Promise<string[]> => {
  const ipfsUrls: string[] = [];

  try {
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file, file.name); // 将文件添加到 FormData 中

      // 上传文件到 IPFS
      const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
        headers: {
          Authorization: `Bearer ${jwt}`, // 替换为你的 Bearer token
        },
      });

      if (response.data && response.data.IpfsHash) {
        const fileHash = response.data.IpfsHash;
        const fileUrl = `https://ipfs.io/ipfs/${fileHash}`;
        ipfsUrls.push(fileUrl);
        console.log(`File uploaded to IPFS: ${fileUrl}`);
      } else {
        throw new Error(`Failed to upload file: ${file.name}`);
      }
    }

    return ipfsUrls;
  } catch (error) {
    console.error("Error uploading files to IPFS:", error);
    throw error;
  }
};

export const uploadMetadataToIPFS = async (
  metadataList: any[]
): Promise<{
  metadataUrls: string[],
  metadataMapping: { metadata: any, metadataUrl: string }[]
}> => {
  const metadataMapping: { metadata: any, metadataUrl: string }[] = [];

  try {
    const metadataUrls = await Promise.all(
      metadataList.map(async (metadata, index) => {
        const blob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
        const formData = new FormData();
        formData.append("file", blob, "metadata.json");

        const response = await axios.post(
          "https://api.pinata.cloud/pinning/pinFileToIPFS",
          formData,
          {
            headers: {
              Authorization: `Bearer ${jwt}`, // 替换为你的 Bearer token
            },
          }
        );

        if (response.data && response.data.IpfsHash) {
          const metadataUrl = `https://ipfs.io/ipfs/${response.data.IpfsHash}`;
          metadataMapping[index] = { metadata, metadataUrl }; // 按索引插入到 metadataMapping
          return metadataUrl; // 返回 URL，用于 metadataUrls
        }

        throw new Error("IPFS upload failed");
      })
    );

    return { metadataUrls, metadataMapping };
  } catch (error) {
    console.error("Error uploading metadata to IPFS:", error);
    return { metadataUrls: [], metadataMapping: [] }; // 错误处理返回空结果
  }
};



const getFromApi = ( ipfsHash : string ) =>{
  const hash = ipfsHash;
  console.log(hash)
  try {
    return axios.get(`https://white-occupational-heron-122.mypinata.cloud/ipfs/${hash}?pinataGatewayToken=${token}`, {
  }).catch((err)=>{
      console.log(err);
  });
  } catch (error) {
    console.log(error);
  }
}
  
 
export const uploadFileToIPFS = (file:File) => uploadFile(file)

export const addToIPFS = (yourJSON: object) => fetchFromApi({ path: "https://api.pinata.cloud/pinning/pinFileToIPFS", method: "Post", body: yourJSON });

export const getMetadataFromIPFS = (ipfsHash: string) =>
  getFromApi(ipfsHash);


export const getUrl = (ipfsHash: string) => `https://white-occupational-heron-122.mypinata.cloud/ipfs/${ipfsHash}?pinataGatewayToken=${token}`;
