// client/src/utils/user.js

const USER_STORAGE_KEY = 'focus_cafe_user';

// 更丰富的随机昵称词库
const ADJECTIVES = ['Cozy', 'Clever', 'Dreamy', 'Silent', 'Focused', 'Calm', 'Brave', 'Gentle', 'Happy'];
const NOUNS = ['Panda', 'Fox', 'Owl', 'Bear', 'Cat', 'Reader', 'Writer', 'Thinker', 'Explorer'];

// 创建一个新的随机用户
function createNewUser() {
  const randomAdjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const randomNoun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  
  const newUser = {
    id: crypto.randomUUID(), // 使用内置的加密方法生成唯一的ID
    nickname: `${randomAdjective} ${randomNoun}`
  };

  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    return newUser;
  } catch (error) {
    console.error("Local Storage Error:", error);
    return newUser; // 即使保存失败，也返回新用户信息以供本次会话使用
  }
}

// 获取或创建用户的核心函数
export function getOrCreateUser() {
  try {
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);

    // 如果找到了已保存的用户信息...
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      // 确保解析出的数据包含ID和昵称，防止数据损坏
      if (parsedUser && parsedUser.id && parsedUser.nickname) {
        return parsedUser;
      }
    }
    // 如果没找到，或者数据已损坏，则创建一个新的
    return createNewUser();

  } catch (error) {
    console.error("无法从 localStorage 读取或解析用户信息:", error);
    // 即使发生错误，也要确保能为用户创建一个临时身份
    return createNewUser();
  }
}

