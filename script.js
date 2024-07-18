// 파일 배열 초기화
let files = JSON.parse(localStorage.getItem('files')) || [];

// 채팅 메시지 배열 초기화
let chatMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];

// 프로필 이름 초기화
let profileName = localStorage.getItem('profileName') || '';

// DOM 요소 가져오기
const fileUploadForm = document.getElementById('fileUploadForm');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const chatMessagesDiv = document.getElementById('chatMessages');
const profileNameInput = document.getElementById('profileNameInput');
const saveProfileNameButton = document.getElementById('saveProfileNameButton');

// 파일 크기 제한 (예: 5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// 지원되는 이미지 형식
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

// 프로필 이름 저장 버튼 클릭 이벤트 리스너
saveProfileNameButton.addEventListener('click', function() {
    const newProfileName = profileNameInput.value.trim();
    if (newProfileName !== '') {
        updateChatMessagesWithNewProfileName(newProfileName);
        profileName = newProfileName;
        localStorage.setItem('profileName', profileName);
    }
});

// 초대 링크 생성 버튼 클릭 이벤트 리스너
createInviteLinkButton.addEventListener('click', function() {
    const inviteLink = generateInviteLink();
    copyToClipboard(inviteLink);
    alert('Invite link copied to clipboard:\n' + inviteLink);
});

// 파일 업로드 폼 제출 이벤트 리스너
fileUploadForm.addEventListener('submit', function(event) {
    event.preventDefault(); // 폼 기본 동작 방지

    const file = fileInput.files[0];

    if (file) {
        // 파일 크기 확인
        if (file.size > MAX_FILE_SIZE) {
            alert('파일의 크기가 5MB를 초과하여 업로드를 할 수 없습니다.');
            return;
        }

        const fileInfo = {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            content: null // 파일 내용은 여기에 저장할 수도 있음
        };

        const reader = new FileReader();
        reader.onload = function(e) {
            fileInfo.content = e.target.result;
            files.push(fileInfo);
            saveFiles();
            renderFiles();
        };

        // 파일 형식에 따라 다르게 읽기
        if (file.type.startsWith('image/')) {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }

        fileInput.value = ''; // 파일 입력 필드 초기화
    }
});

// 채팅 폼 제출 이벤트 리스너
chatForm.addEventListener('submit', function(event) {
    event.preventDefault(); // 폼 기본 동작 방지

    const message = messageInput.value.trim();

    if (message !== '') {
        const timestamp = new Date().toLocaleString();
        const chatMessage = {
            message: `${profileName}: ${message}`,
            timestamp
        };

        chatMessages.push(chatMessage);
        saveChatMessages();
        renderChatMessages(); // Render chat messages after adding new message
        messageInput.value = '';
    }
});

// 파일 목록 렌더링 함수
function renderFiles() {
    // Clear previous list
    fileList.innerHTML = '';

    // Get search keyword
    const searchKeyword = searchInput.value.trim().toLowerCase();

    // Reverse the files array to show the latest files first
    const reversedFiles = [...files].reverse();

    reversedFiles.forEach((file, index) => {
        // Check if the file name includes the search keyword
        if (file.name.toLowerCase().includes(searchKeyword)) {
            const fileItem = document.createElement('div');
            fileItem.classList.add('file-item');
           
            const fileName = document.createElement('div');
            fileName.textContent = `${file.name} (${formatFileSize(file.size)})`;

            // 코드 복사 버튼 (이미지 파일이 아닌 경우에만 추가)
            if (!file.type.startsWith('image/')) {
                const copyButton = document.createElement('button');
                copyButton.textContent = '코드 복사';
                copyButton.style.marginLeft = '10px';
                copyButton.addEventListener('click', function() {
                    navigator.clipboard.writeText(file.content).then(() => {
                        alert('코드가 복사되었습니다.');
                    }).catch(err => {
                        alert('코드 복사에 실패했습니다.');
                    });
                });

                fileName.appendChild(copyButton);
            }
            fileItem.appendChild(fileName);

            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = file.content;
                img.style.maxWidth = '100%';
                img.style.marginTop = '10px';
                img.style.borderRadius = '4px';

                // 이미지 우클릭 다운로드 기능
                img.addEventListener('contextmenu', function(event) {
                    event.preventDefault();
                    const userResponse = prompt('이 이미지를 다운로드 하시겠습니까? "y"를 입력하면 다운로드가 됩니다.\n삭제를 원하시면 Enter키를 눌러주세요.');
                    if (userResponse && userResponse.toLowerCase() === 'y') {
                        const link = document.createElement('a');
                        link.href = file.content;
                        link.download = file.name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                });

                fileItem.appendChild(img);
            } else {
                const fileContent = document.createElement('pre');
                fileContent.textContent = file.content;
                fileContent.style.backgroundColor = '#f0f0f0';
                fileContent.style.padding = '10px';
                fileContent.style.borderRadius = '4px';
                fileContent.style.overflowX = 'auto';
                fileContent.style.whiteSpace = 'pre-wrap';
                fileContent.style.fontFamily = 'monospace';

                fileItem.appendChild(fileContent);
            }

            // 우클릭 이벤트 추가
            fileItem.addEventListener('contextmenu', function(event) {
                event.preventDefault();
                if (confirm(`정말로 ${file.name}을(를) 삭제하시겠습니까?`)) {
                    files.splice(index, 1);
                    saveFiles();
                    renderFiles();
                }
            });

            fileList.appendChild(fileItem);
        }
    });
}

// 채팅 메시지 렌더링 함수
function renderChatMessages() {
    chatMessagesDiv.innerHTML = '';

    chatMessages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.textContent = `[${message.timestamp}] ${message.message}`;
        chatMessagesDiv.appendChild(messageDiv);
    });

    // Scroll to bottom of chat messages
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
}

// 파일 크기 포맷팅 함수
function formatFileSize(size) {
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 파일 목록 저장 함수
function saveFiles() {
    localStorage.setItem('files', JSON.stringify(files));
}

// 초대 링크 생성
function generateInviteLink() {
    const roomUrl = window.location.href.split('?')[0];
    return roomUrl + '?invite=' + generateRandomString();
}

// 랜덤 문자열 생성
function generateRandomString() {
    return Math.random().toString(36).substr(2, 10);
}

// 클립보드로 복사
function copyToClipboard(text) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
}

// 채팅 메시지 저장 함수
function saveChatMessages() {
    localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
}

// 프로필 이름 변경 시 채팅 메시지 업데이트 함수
function updateChatMessagesWithNewProfileName(newProfileName) {
    const oldProfileName = profileName;
    chatMessages = chatMessages.map(chatMessage => {
        if (chatMessage.message.startsWith(`${oldProfileName}:`)) {
            return {
                ...chatMessage,
                message: chatMessage.message.replace(`${oldProfileName}:`, `${newProfileName}:`)
            };
        }
        return chatMessage;
    });
    saveChatMessages();
    renderChatMessages();
}

// 페이지 로드 시 파일 및 채팅 메시지 렌더링
window.addEventListener('load', function() {
    // 프로필 이름 입력 필드 초기화
    profileNameInput.value = profileName;

    renderFiles();
    renderChatMessages();
});

// 검색 폼 제출 이벤트 리스너
searchForm.addEventListener('submit', function(event) {
    event.preventDefault(); // 폼 기본 동작 방지
    renderFiles(); // 다시 파일 목록 렌더링
});

// 검색 입력 변경 이벤트 리스너 (실시간 검색)
searchInput.addEventListener('input', function() {
    renderFiles(); // 다시 파일 목록 렌더링
});
