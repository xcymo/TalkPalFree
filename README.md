# 口语搭子 · Spoken English

一个**纯前端、移动端优先**的英语口语练习 Web App：说一句或打一句英文，语音会先经 MiMo ASR 转写，文字则直接进入 MiMo LLM 纠错并回复，再由 MiMo TTS 读出来。所有练习记录、话题、语音缓存和 API Key 都只保存在浏览器本地，没有后端。

- 技术栈：Vite + React 18 + TypeScript + Tailwind CSS 3
- 存储：IndexedDB（Dexie）+ localStorage
- 录音：MediaRecorder，录音后自动转成 16 kHz 单声道 WAV 再发给 ASR
- 图标：lucide-react

---

## 快速开始

要求 Node.js ≥ 18。

```bash
npm install
npm run dev
```

打开终端输出的地址（默认 `http://localhost:5173`）。生产构建：

```bash
npm run build
npm run preview
```

> 如果 `npm install` 后缺少 `vite` / `tailwindcss`（某些机器全局配置了 `omit=dev`），执行：
> `npm install --include=dev`

### 手机上打开

麦克风需要**安全上下文**：`localhost` 或 HTTPS。用手机通过局域网 IP 访问 `http://192.168.x.x:5173` 时，浏览器会拒绝录音，可以：

1. 用 HTTPS 隧道（如 Cloudflare Tunnel / ngrok）暴露本地 5173；或
2. 把构建产物部署到任意 HTTPS 静态托管（Vercel / Netlify / Cloudflare Pages 等）；或
3. 只在桌面 Chrome 的 localhost 上先体验。

Vite 已配置 `host: true`，同一 Wi-Fi 下可直接访问（但录音仍需 HTTPS）。

---

## 配置 MiMo API Key

1. 打开 MiMo 平台：<https://platform.xiaomimimo.com/>（首次 API 调用文档：<https://mimo.mi.com/docs/en-US/quick-start/summary/first-api-call>）。
2. 在控制台创建 API Key（通常以控制台实际展示为准）。
3. 回到 App 的「设置」页，粘贴 Key → 保存。

Key 只写入当前浏览器的 `localStorage`（键名 `spoken-english:settings`），所有请求只发往：

```text
https://api.xiaomimimo.com/v1
Authorization: Bearer <你的 Key>
```

不会发送到任何第三方服务器。

---

## MiMo API 集成说明

### 1. ASR（语音识别）

- 模型：`mimo-v2.5-asr`
- 端点：`POST /v1/chat/completions`（MiMo 的 ASR/TTS 都走 Chat Completions）
- 浏览器录音格式通常是 `webm/opus` 或 `mp4/aac`，而官方目前只支持 **wav / mp3**。因此前端会：
  1. `MediaRecorder` 录音；
  2. 用 Web Audio `decodeAudioData` 解码；
  3. 重采样为 **16 kHz 单声道 16-bit PCM WAV**；
  4. 转 base64，按官方 Data URL 形式发送。

请求体（前端 `src/lib/api.ts`）：

```json
{
  "model": "mimo-v2.5-asr",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "input_audio",
          "input_audio": { "data": "data:audio/wav;base64,...." }
        }
      ]
    }
  ],
  "asr_options": { "language": "en" }
}
```

识别结果从 `choices[0].message.content` 读取。60 秒录音转 WAV 后 base64 约 2.6 MB，低于官方 10 MB 限制。

> **ASR 请求格式请以官方文档为准**：<https://mimo.mi.com/static/docs/quick-start/usage-guide/audio/Speech-Recognition.md>
> 若官方以后调整字段，只需修改 `src/lib/api.ts` 的 `transcribeAudio`。

### 2. LLM 纠错 + 回复（一次请求）

- 模型：`mimo-v2.6-flash`（在 `src/config/models.ts` 可换成 `mimo-v2.6-pro`）
- `response_format: { "type": "json_object" }`
- `max_completion_tokens: 1800`
- 系统提示词完整定义了 JSON schema，并要求只输出 JSON。
- 最近几轮对话会作为真实的 `messages`（`assistant`/`user`）传入；当前话题放在 system 提示词里，最后一条 user 消息只包含本次转写文本的 JSON，避免每轮重复话题、把回复锚回开场。

返回结构（前端会做宽松解析和字段归一化，避免模型偶尔加 markdown 代码块导致白屏）：

```json
{
  "corrections": [
    {
      "original": "用户原句中的错误片段",
      "corrected": "最标准/自然的英语说法",
      "reason_zh": "中文解释",
      "type": "grammar | word_choice | collocation | other"
    }
  ],
  "optimized_full_sentence": "整句优化后的标准英语",
  "reply_text": "AI 的英文回复（用于对话延续和 TTS）",
  "reply_translation_zh": "reply_text 的中文翻译"
}
```

### 3. TTS（语音合成）

- 模型：`mimo-v2.5-tts`
- 端点：`POST /v1/chat/completions`
- 要朗读的文本必须放在 `assistant` 消息里；`user` 消息用于控制语气。
- 音色通过 `audio.voice` 指定，输出 mp3。
- 返回音频在 `choices[0].message.audio.data`（base64）。

```json
{
  "model": "mimo-v2.5-tts",
  "messages": [
    { "role": "user", "content": "Speak as a warm, friendly English conversation partner..." },
    { "role": "assistant", "content": "Sure, I can help with that. Which museum..." }
  ],
  "audio": { "format": "mp3", "voice": "Mia" }
}
```

**音频缓存**：以 `voice + 文本长度 + 文本哈希` 作为 key，把音频 Blob 存进 IndexedDB 的 `audioCache`。同一段回复再次播放会直接读缓存，不再请求 TTS；播放控件支持播放 / 暂停。缓存最多保留 120 条，超出后按创建时间清理最旧的。

---

## 数据存储

IndexedDB 数据库名：`spoken-english`（Dexie，定义在 `src/lib/db.ts`）。

| 表 | 主键 | 内容 |
| --- | --- | --- |
| `topics` | `dateKey`（`YYYY-MM-DD`） | 当天话题，每天一条 |
| `sessions` | 自增 `id` + `dateKey` / `topicId` 索引 | 每一轮练习：原文、纠错、优化句、AI 回复、音色、TTS 缓存 key、时间。历史页会把同一天同一话题的多轮合并为一条记录 |
| `audioCache` | `key` | TTS 音频 Blob 及其文本 / 音色 |
| `meta` | `key` | 用量估算（`usage:total`、`usage:YYYY-MM-DD`） |

localStorage 只存设置：API Key、音色、主题、自动播放。

「设置 → 清除本地数据并重置」会清空以上 IndexedDB 表和 `spoken-english:*` 的 localStorage 键。

---

## 目录结构

```text
.
├─ index.html
├─ package.json
├─ vite.config.ts
├─ tailwind.config.js
├─ postcss.config.js
├─ tsconfig.json
├─ public/
│  └─ favicon.svg
└─ src/
   ├─ main.tsx                 # 入口
   ├─ App.tsx                  # 路由外壳 + 底部导航
   ├─ index.css                # Tailwind + 设计变量 + 深色模式
   ├─ types.ts                 # 所有领域类型
   ├─ components/
   │  ├─ BottomNav.tsx
   │  ├─ ConfirmDialog.tsx
   │  ├─ CorrectionList.tsx
   │  ├─ CorrectionsPanel.tsx # 默认收起的纠错展开面板
   │  ├─ EmptyState.tsx
   │  ├─ ErrorBanner.tsx
   │  ├─ ErrorBoundary.tsx
   │  ├─ PageHeader.tsx
   │  ├─ HoldToTalk.tsx        # 按住说话、上滑取消
   │  ├─ ReplyCard.tsx
   │  ├─ SentenceCompare.tsx  # 原句 / 优化句对照
   │  ├─ Spinner.tsx
   │  ├─ Toast.tsx
   │  ├─ TopicCard.tsx
   │  ├─ TopicFilter.tsx      # 自定义历史话题筛选
   │  └─ VoiceSelect.tsx      # 自定义分组音色选择器
   ├─ config/
   │  ├─ models.ts             # Base URL、模型名、录音限制、纠错类型配色
   │  └─ voices.ts             # 音色集中配置
   ├─ data/
   │  └─ topics.ts             # 24 个内置话题池 + 兜底逻辑
   ├─ hooks/
   │  ├─ useHashRoute.ts       # #/today | #/practice | #/history | #/settings
   │  ├─ usePractice.tsx       # App 级练习流程（切换页面不中断 ASR/LLM）
   │  ├─ useRecorder.ts        # MediaRecorder + 权限 + 计时 + 自动停止
   │  ├─ useSettings.tsx       # 设置 Context + 主题应用
   │  └─ useTts.ts             # TTS 播放 / 暂停 + 缓存
   ├─ lib/
   │  ├─ api.ts                # ASR / LLM / TTS 封装、错误映射、JSON 宽松解析
   │  ├─ audio.ts              # 转 16k 单声道 WAV、base64、MIME 选择
   │  ├─ db.ts                 # Dexie schema 与读写封装
   │  ├─ schemas.ts            # 纠错 / 话题提示词与 JSON schema
   │  ├─ settings.ts           # localStorage 设置 + 主题
   │  ├─ topicService.ts       # 每日话题生成 / 换话题（含并发去重）
   │  └─ utils.ts              # 日期、计时、streak、缓存 key 等
   └─ pages/
      ├─ TodayPage.tsx
      ├─ PracticePage.tsx
      ├─ HistoryPage.tsx
      └─ SettingsPage.tsx
```

---

## 如何新增话题

编辑 `src/data/topics.ts`，往 `TOPIC_POOL` 数组追加一项，字段全部必填：

```ts
{
  id: 'unique-id',                    // 唯一，用于「换一个」时避让
  scene: 'Ordering coffee',           // 英文场景（≤8 词）
  sceneZh: '咖啡店点单',
  titleEn: 'A complicated coffee order',
  titleZh: '一杯有要求的咖啡',
  promptZh: '告诉对方你要点什么，并提出两个具体要求。',
  icebreakerEn: 'Good morning! What can I get started for you?',
  icebreakerZh: '早上好！想喝点什么？',
}
```

- 每天首次打开 App 时，LLM 会从话题池随机抽 6 个场景作为候选，选一个并细化为当天话题。
- 没有 API Key 或生成失败时，会直接用内置字段兜底（页面会提示）。
- 点「换一个」会排除当前话题的 `poolId`，重新请求。
- 话题卡下方还有一行不显眼的入口「想聊别的？输入关键词生成话题」，输入关键词后会让 LLM 生成一个自定义话题，保存为今天的话题并直接替换卡片内容。

## 如何调整纠错 schema

1. `src/lib/schemas.ts`
   - `CORRECTION_JSON_SCHEMA`：给模型看的 schema 文本；
   - `CORRECTION_SYSTEM_PROMPT`：纠错规则、语气、输出要求；
   - `TTS_STYLE_INSTRUCTION`：TTS 的语气指令。
2. `src/types.ts` 的 `CorrectionResult` / `Correction`：前端类型。
3. `src/lib/api.ts`
   - `normalizeCorrections`：字段归一化（新增字段要在这里补）；
   - `correctAndReply`：解析和兜底。
4. `src/components/CorrectionList.tsx`：渲染；新增类型时，在 `src/config/models.ts` 的 `CORRECTION_TYPE_META` 里加配色与中文标签。

## 如何新增音色

只改 `src/config/voices.ts`，往 `VOICES` 加一项即可；设置页下拉框、TTS 缓存 key 和播放都会自动读取。当前内置：

| 英文 | 中文 |
| --- | --- |
| Mia、Chloe、Milo、Dean | 冰糖、茉莉、苏打、白桦 |

---

## 交互与界面

- 移动端单列，最大宽度 520px，桌面居中；`safe-area` 适配。
- 底部导航：今日 / 练习 / 历史 / 设置；内容区预留底部空间，不被导航遮挡。
- 练习流程运行在 App 级 Provider 中：等待 AI 回复时切换页面不会中断请求，回到练习页仍能看到结果，记录也会正常写入。
- 练习页输入区像聊天软件一样固定在底部导航上方：每次进入默认语音输入，左侧按钮切换语音 / 文字；文字输入跳过 ASR 直接交给 LLM，单行输入框会随内容增高；语音输入按住说话，上滑取消，松开提交。
- 练习页是一条连续的对话：你的消息靠右、AI 回复靠左，不分轮次、不折叠；「更自然的说法」和具体纠错收在你说的话旁边的纠错图标里，AI 回复的中文翻译默认折叠；刷新或切页回来会从 IndexedDB 完整恢复。
- 历史页按日期分组，同一天同一话题的多轮对话合并为一条记录，展开后按 Round 顺序查看每一轮的原句、纠错和 AI 回复。
- 录音：按住「按住说话」开始，松开结束并提交；手指上滑超过一定距离后松开会取消本次录音；最长 60 秒自动结束。
- 原句与 AI 优化句使用明显不同的样式：你说的句子用右侧品牌色气泡、正文字体，「更自然的说法」点开你说的话旁边的小按钮查看，用衬线字体强调。
- AI 纠错默认收起：练习页点你说的话旁边的「N 处纠错」按钮展开，历史页点「AI 纠错」按钮展开，避免页面和对话记录过长。
- AI 回复只在**新回复刚产生时**自动播放一次；切换页面再回来不会重新播放旧语音。播放控件支持播放 / 暂停，再次播放走本地缓存。
- 深色模式：跟随系统或手动切换。
- 空状态、加载状态、401 / 402 / 429 / 网络失败 / 超时都有中文提示；另有 ErrorBoundary 兜底，避免白屏。

---

## 验收清单（逐条说明）

1. **录音 → ASR → 纠错 → TTS 完整流程**：已实现。录音经 Web Audio 转 16 kHz WAV，ASR 结果自动进入 LLM，结果页渲染纠错与 AI 回复，TTS 可播放。使用真实 Key 即可走通；开发时已用 Chrome 假麦克风 + mock API 跑通全流程。
2. **同一回复第二次播放不重复请求 TTS**：是。音频 Blob 按 `voice + 文本 hash` 存入 IndexedDB；首次播放触发 1 次 TTS 请求，暂停后再次播放或播放结束后重新播放都直接使用本地音频，不会重复请求。
3. **纠错 JSON 能被解析并渲染为卡片**：是。兼容纯 JSON、```json 代码块、前后夹杂说明文字；字段非法时归一化，缺失 `reply_text` 会给出友好错误而非崩溃。
4. **话题每天自动生成一次 + 手动换一个**：是。`topics` 表按本地日期存一条；首次打开（今日或练习页）生成并保存，刷新不会重复请求；「换一个」才会重新请求并避让当前场景。
5. **API 错误友好降级**：是。401/403 提示检查 Key，402 提示余额，429 提示频率/额度，5xx 与网络失败、超时均有中文提示；结果页不会白屏。已验证 401 场景。
6. **移动端无横向滚动 + 底部导航不遮挡**：是。390px 视口实测 `scrollWidth === clientWidth`；内容区 `pb-28` 并适配 safe-area。
7. **历史记录刷新不丢、按日期可追溯**：是。每轮结果写入 IndexedDB，刷新/重开浏览器仍在；历史页按日期分组，同一天同一话题的多轮对话合并成一条记录，展开即可逐轮查看原句、纠错和回复并播放，也支持按话题筛选。

---

## 已知限制

- **麦克风需要 HTTPS 或 localhost**，局域网 HTTP 地址无法录音。
- 浏览器自动播放策略可能拦截 AI 回复的自动播放，此时会出现提示，手动点播放即可（也可在设置关闭自动播放）。
- 纯前端直连 MiMo API 依赖服务端允许 CORS。如果遇到浏览器 CORS 报错，需要官方放开跨域，或自行加一个仅做转发的本地代理（这会引入后端，超出本项目的纯前端定位）。
- 用量是按 API 返回的 LLM tokens + ASR/TTS 估算的前端参考值，实际计费以 MiMo 控制台为准。
- ASR 官方目前只支持 wav/mp3；如果未来格式变化，请按官方文档调整 `src/lib/api.ts` 和 `src/lib/audio.ts`。

---

## 隐私

- 只有录音、对话文本和 TTS 请求会发送给 MiMo 官方 API。
- 不存在自建服务器、埋点或第三方请求。
- 所有历史、话题、音频缓存都在本机 IndexedDB；清除浏览器数据或使用设置页的「清除本地数据」即可删除。
