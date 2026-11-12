你是一名资深前端工程师。请直接开始实现一个“纯前端、移动端浏览器优先”的英语口语练习 Web App，不要只给方案，按下面的需求直接交付可运行代码。

【核心定位】
用户（中文母语，英语约5000词汇，听力70-80%）发语音 → MiMo ASR 转文字 → MiMo LLM 纠错并生成回复 → MiMo TTS 播放回复。所有数据存 IndexedDB/localStorage，纯前端，无后端。

【技术栈】
Vite + React + TypeScript + Tailwind CSS。移动端优先，桌面居中 max-width 480–560px。录音用 MediaRecorder。数据用 IndexedDB（推荐 Dexie.js）。图标用 lucide-react。不要引入重型 UI 框架。

【MiMo API 集成规范——必须严格遵守】
Base URL: https://api.xiaomimimo.com/v1 （OpenAI 兼容格式）
认证: Authorization: Bearer <API_KEY>，Key 由用户在设置页填入，存 localStorage。

1. ASR（语音识别）
   - model: mimo-v2.5-asr
   - 端点: POST /v1/chat/completions（MiMo 的 ASR/TTS 均通过 Chat Completions 运行，没有独立的 /audio/* 端点）
   - 请求方式: 将音频转为 base64 后作为消息内容发送。具体格式请以官方 Speech Recognition 文档为准（https://mimo.mi.com/static/docs/quick-start/usage-guide/audio/Speech-Recognition.md）。前端录音建议用 audio/webm 格式，若 API 要求其他格式，需在前端做转码或提示用户。
   - 输出: 识别文本字符串。

2. LLM 纠错 + 回复（一次请求完成，输出 JSON）
   - model: mimo-v2.6-flash 或 mimo-v2.6-pro（推荐 flash 控制成本）
   - 端点: POST /v1/chat/completions
   - 必须设置 response_format: { "type": "json_object" } 以开启 JSON 模式。
   - 系统提示词必须完整定义 JSON schema，并要求模型只返回 JSON，不输出任何额外解释。max_completion_tokens 设为 1500–2000，避免截断。
   - JSON 结构必须包含：
     {
       "corrections": [
         {
           "original": "用户原句中的错误片段",
           "corrected": "最标准/自然的英语说法",
           "reason_zh": "中文解释为什么错/为什么这样改",
           "type": "grammar | word_choice | collocation | other"
         }
       ],
       "optimized_full_sentence": "整句优化后的标准英语",
       "reply_text": "AI 用英语给你的自然回复（用于对话延续）",
       "reply_translation_zh": "reply_text 的中文翻译（可选，方便用户理解）"
     }
   - corrections 数组可以为空（如果用户没有错误），但字段必须存在。

3. TTS（语音合成）
   - model: mimo-v2.5-tts
   - 端点: POST /v1/chat/completions
   - 请求体中通过参数指定音色。预置音色包括（英文场景推荐）：Mia（Bright, youthful female）、Chloe（Warm, sophisticated female）、Milo（Energetic, friendly male）、Dean（Deep, authoritative male）。
   - 前端必须实现音频缓存：同一段 reply_text 首次请求 TTS 后，将音频 Blob 存入 IndexedDB，后续播放直接读缓存，不重复请求。播放控件需支持播放/暂停/重播。

【功能需求】
1. 底部导航：今日 / 练习 / 历史 / 设置。
2. 今日页：
   - 显示今日话题。话题生成机制：每天首次打开 App 时，若当天无话题，自动调用一次 LLM 生成（从内置主题池中选一个场景 + 一个具体话题，输出英文话题描述 + 中文提示）。页面提供“换一个话题”按钮，点击才重新请求。
   - 显示今日练习次数和连续打卡天数。
3. 练习页（核心流程）：
   - 展示当前话题。
   - 录音按钮（按住说话或点击开始/结束），录音时显示计时和状态。
   - 录音结束后自动执行：ASR → LLM 纠错+回复 → 展示结果。
   - 结果展示分两块：
     a) 纠错卡片：每条 correction 显示“原句片段 → 标准说法”，下方中文解释，用颜色/标签区分错误类型。
     b) AI 回复卡片：显示 reply_text（英文）和中文翻译，旁边有播放按钮（TTS，带缓存）。
   - 用户可以“继续下一轮”，话题不变，对话上下文累积（将最近几轮对话作为 messages 传入 LLM，实现连贯对话）。
   - 每轮结果写入 IndexedDB，包含：时间、话题、用户原文、corrections、optimized_full_sentence、reply_text、音频缓存引用。
4. 历史页：
   - 按日期分组展示练习记录。每条记录可展开查看当时的纠错和回复。
   - 支持按话题筛选。
5. 设置页：
   - API Key 输入框（密码遮蔽，存 localStorage）。
   - 音色选择下拉框（Mia / Chloe / Milo / Dean / 冰糖 / 茉莉 / 苏打 / 白桦）。
   - 清除本地数据（IndexedDB + localStorage）并重置。
   - 显示 MiMo API 用量提示（可选：记录并展示已消耗的大致 token 数，仅前端估算）。

【交互与 UI 要求】
- 移动端单列布局，safe-area 适配，触控目标 ≥44px。
- 录音状态要有明确的视觉反馈（红色脉冲/波形/计时）。
- 纠错卡片用柔和的颜色区分类型（语法/用词/搭配），不要红色警告感，保持学习产品的轻松感。
- TTS 播放按钮在播放中变成暂停图标，支持重播。
- 深色模式支持（跟随系统或手动切换）。
- 空状态、加载状态、API 错误（Key 无效、余额不足、网络失败）都要有友好提示。
- 所有敏感请求（API Key）只在浏览器端使用，不发送到任何第三方服务器（除 MiMo 官方 API 外）。

【数据与可扩展性】
- 内置话题池至少 20 个日常场景话题（点餐、问路、改预约、闲聊、购物、电话、道歉、表达观点等），存为 JSON/TS 数据文件。
- 纠错 JSON schema 定义在独立文件中，方便后续调整。
- 音色列表集中配置，新增音色只改配置。

【交付要求】
直接输出完整可运行项目：
- 文件树、package.json、vite/tailwind 配置、入口文件。
- 所有页面、组件、hooks、工具函数、类型定义。
- IndexedDB schema（Dexie）和 ASR/LLM/TTS 的 API 调用封装。
- README：运行方式、MiMo Key 获取方式、如何新增话题、如何调整纠错 schema。
- 确保 npm install && npm run dev 可运行。

【验收清单——完成后逐条说明】
1. 录音→ASR→纠错→TTS 完整流程可走通（API Key 有效时）。
2. 同一段回复第二次播放不重复请求 TTS（读 IndexedDB 缓存）。
3. 纠错 JSON 能被前端正确解析并渲染为卡片。
4. 话题每天自动生成一次，手动“换一个”可重新生成。
5. API 错误有友好降级提示，不白屏。
6. 移动端浏览器无横向滚动，底部导航不遮挡内容。
7. 历史记录刷新不丢，按日期可追溯。

现在请直接开始实现。如果 MiMo 官方 ASR 的音频请求格式在实现时有不确定性，先按最合理的 base64 方式封装，并在 README 中注明“ASR 请求格式请以官方文档为准”，不要因此阻塞其他部分。