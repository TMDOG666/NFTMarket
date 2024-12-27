export function weiToEther(weiValue: string): string {
    // 将 Wei 值转换为 BigInt
    const weiBigInt = BigInt(weiValue);
  
    // 计算 Ether 值
    const etherBigInt = weiBigInt / BigInt(10 ** 18);
  
    // 计算余数
    const remainder = weiBigInt % BigInt(10 ** 18);
  
    // 将余数转换为 Ether 小数部分
    const etherFraction = remainder.toString().padStart(18, '0').slice(0, 18);
  
    // 组合整数部分和小数部分
    let result = `${etherBigInt}`;
    if (etherFraction !== '000000000000000000') {
      // 去掉末尾的零
      result += `.${etherFraction.replace(/0+$/, '')}`;
    }
  
    return result;
  }