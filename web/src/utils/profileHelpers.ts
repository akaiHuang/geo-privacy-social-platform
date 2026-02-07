// 將文字中的 URL 轉換為可點擊的連結
export function linkify(text: string): string {
  if (!text) return '';
  
  // URL 正則表達式
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  
  // 替換 URL 為 <a> 標籤
  return text.replace(urlPattern, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="bio-link">${url}</a>`;
  });
}

// 計算年齡
export function calculateAge(birthday: string): number {
  const today = new Date();
  const birthDate = new Date(birthday);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// 格式化生日顯示
export function formatBirthday(birthday: string): string {
  const date = new Date(birthday);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
}

// 獲取性別顯示文字
export function getGenderText(gender?: string): string {
  switch (gender) {
    case 'male':
      return '♂️ 男性';
    case 'female':
      return '♀️ 女性';
    case 'other':
      return '⚧ 其他';
    case 'prefer_not_to_say':
      return '🔒 不透露';
    default:
      return '';
  }
}
