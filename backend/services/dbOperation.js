// 5. 通用数据库操作函数
const fetchWithPagination = async (model, query, sort, limit, offset) => {
    try {
      return await model.find(query).sort(sort).skip(offset).limit(limit);
    } catch (err) {
      console.error("Error fetching paginated data:", err);
      throw new Error("Unable to fetch paginated data");
    }
  };
  
  const upsert = async (model, query, data) => {
    try {
      // 查找现有文档，若不存在则创建新文档
      let doc = await model.findOne(query);
  
      if (!doc) {
        // 如果文档不存在，创建一个新的
        doc = new model(data);
      } else {
        // 如果文档已存在，更新字段
        Object.assign(doc, data);
      }
  
      // 使用 .save() 保存更新或新创建的文档
      const savedDoc = await doc.save();
  
      return savedDoc;
    } catch (err) {
      console.error("Error upserting data:", err);
      throw new Error("Unable to upsert data");
    }
  };
  
  export { fetchWithPagination, upsert };
  