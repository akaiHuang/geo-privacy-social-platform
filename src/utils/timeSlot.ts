/**
 * 時間槽工具函數
 * 用於時光回溯功能的時間管理
 */

/**
 * 生成時間槽標記（每30分鐘一個槽）
 * @param date 日期對象
 * @returns 格式化的時間槽字串 "2025-10-25 14:30"
 */
export const generateTimeSlot = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  
  // 將分鐘標準化為 00 或 30
  const minutes = date.getMinutes() >= 30 ? '30' : '00';
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

/**
 * 計算貼文的過期時間（30分鐘後）
 * @param createdAt 創建時間
 * @returns 過期時間
 */
export const calculateExpiresAt = (createdAt: Date): Date => {
  const expiresAt = new Date(createdAt.getTime());
  expiresAt.setMinutes(expiresAt.getMinutes() + 30);
  return expiresAt;
};

/**
 * 檢查貼文是否已過期
 * @param expiresAt 過期時間
 * @returns 是否已過期
 */
export const isPostExpired = (expiresAt: Date): boolean => {
  return new Date() > expiresAt;
};

/**
 * 生成時間槽列表（用於時間滑桿）
 * @param maxHistoryHours 最大歷史小時數（預設24小時）
 * @returns 時間槽陣列
 */
export const generateTimeSlots = (maxHistoryHours: number = 24): string[] => {
  const slots: string[] = [];
  const now = new Date();
  const totalSlots = maxHistoryHours * 2; // 每小時2個槽

  for (let i = totalSlots; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 30 * 60 * 1000);
    slots.push(generateTimeSlot(time));
  }

  return slots;
};

/**
 * 格式化時間槽為顯示字串
 * @param timeSlot 時間槽字串
 * @returns 顯示用的格式 "10/25 14:30"
 */
export const formatTimeSlotDisplay = (timeSlot: string): string => {
  const [date, time] = timeSlot.split(' ');
  const [_year, month, day] = date.split('-');
  return `${month}/${day} ${time}`;
};

/**
 * 計算時間槽距離現在的小時數
 * @param timeSlot 時間槽字串
 * @returns 小時數（可能是小數）
 */
export const getHoursAgo = (timeSlot: string): number => {
  const [date, time] = timeSlot.split(' ');
  const [year, month, day] = date.split('-');
  const [hours, minutes] = time.split(':');
  
  const slotDate = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes)
  );
  
  const now = new Date();
  const diffMs = now.getTime() - slotDate.getTime();
  return diffMs / (1000 * 60 * 60);
};

/**
 * 獲取當前時間槽
 * @returns 當前時間槽字串
 */
export const getCurrentTimeSlot = (): string => {
  return generateTimeSlot(new Date());
};

/**
 * 解析時間槽字串為 Date 對象
 * @param timeSlot 時間槽字串
 * @returns Date 對象
 */
export const parseTimeSlot = (timeSlot: string): Date => {
  const [date, time] = timeSlot.split(' ');
  const [year, month, day] = date.split('-');
  const [hours, minutes] = time.split(':');
  
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes)
  );
};
