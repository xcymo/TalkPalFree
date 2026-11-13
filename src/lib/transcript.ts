const TIMESTAMP_PREFIX = /^(?:\[\d{1,2}:\d{2}(?::\d{2})?\]|\d{1,2}:\d{2}:\d{2})[\s\-–—:.]*/;
// 只把「编号 + 空格」当分段前缀，避免把 1.5 / 2.0 这类数字裁掉
const SEGMENT_PREFIX = /^\d{1,2}\s*[.、)]\s+(?=\S)/;
const BARE_ONE_PREFIX =
  /^1\s+(?=(?:I|I'd|I'm|I'll|Could|Can|Would|Do|Does|Is|Are|The|A|An|We|You|He|She|They|There|It|My|Our|This|That)\b)/;

/** 句首出现 1 时，后面跟这些词通常是 "I" 被归一化成了数字。 */
const I_VERBS = [
  'want', 'need', 'think', 'thought', 'feel', 'felt', 'guess', 'know', 'knew', 'mean',
  'meant', 'say', 'said', 'have', 'has', 'had', 'am', 'was', 'were', 'will', 'would',
  'can', 'could', 'should', 'must', 'may', 'might', 'do', 'did', "don't", "doesn't", "didn't",
  "can't", "couldn't", "won't", "wouldn't", "shouldn't", "haven't", "hasn't", "hadn't",
  'like', 'love', 'hate', 'enjoy', 'prefer', 'hope', 'wish', 'remember', 'forgot',
  'forget', 'understand', 'agree', 'disagree', 'believe', 'imagine', 'wonder', 'suppose',
  'assume', 'recommend', 'suggest', 'apologize', 'appreciate', 'notice', 'noticed',
  'realize', 'realized', 'see', 'saw', 'heard', 'hear', 'got', 'get', 'went', 'go',
  'going', 'come', 'came', 'live', 'work', 'study', 'play', 'try', 'tried', 'start',
  'started', 'stop', 'stopped', 'keep', 'kept', 'let', 'make', 'made', 'take', 'took',
  'give', 'gave', 'find', 'found', 'look', 'looked', 'watch', 'watched', 'read', 'write',
  'wrote', 'eat', 'ate', 'drink', 'drank', 'sleep', 'slept', 'wake', 'woke', 'buy',
  'bought', 'pay', 'paid', 'spend', 'spent', 'use', 'used', 'call', 'called', 'email',
  'emailed', 'text', 'texted', 'meet', 'met', 'visit', 'visited', 'move', 'moved', 'leave',
  'left', 'arrive', 'arrived', 'miss', 'missed', 'dunno', 'really', 'just', 'also',
  'actually', 'usually', 'often', 'always', 'never', 'sometimes', 'probably', 'maybe',
  'still', 'already', 'only', 'even', 'totally', 'definitely', 'certainly', 'honestly',
  'personally',
].join('|');

const LEADING_ONE_CONTRACTION = /^1('m|'ve|'d|'ll)\b/i;
const LEADING_ONE_AS_I = new RegExp(`^1(\\s+)(?=(?:${I_VERBS})\\b)`, 'i');

/** 这些情况下的 1 更可能是真实数字，不能还原成 I。 */
const NUMERIC_ONE_CONTEXT =
  /^1\s+(?:(?:can|cup|cups|bottle|bottles|slice|slices|piece|pieces)\s+of\b|(?:hour|hours|minute|minutes|day|days|week|weeks|month|months|year|years|million|billion|thousand|hundred|percent|dollar|dollars|euro|euros|person|people|apple|apples|ticket|tickets|room|rooms|seat|seats)\b|may\s+(?:\d{4}|\d{1,2}(?:st|nd|rd|th)?)\b)/i;
const NUMERIC_TIME_CONTEXT = /^1\s+(?:AM|PM)\b/;

/** 句首出现 0 时，后面跟这些词通常是 "Oh" 被写成了数字。 */
const OH_STARTERS = [
  'i', "i'm", "i'd", "i'll", "i've", 'yeah', 'yes', 'no', 'well', 'sorry', 'right',
  'okay', 'ok', 'sure', 'maybe', 'actually', 'thanks', 'thank', 'that', 'it', 'we',
  'you', 'they', 'he', 'she', 'there', 'my', 'wow', 'hmm', 'uh', 'oh',
].join('|');

// 0, / 0. / 0! 后面通常是一句话的开头；排除 0.5 这类小数
const LEADING_ZERO_AS_OH_PUNCT = /^0(?=\s*(?:[,!?;]|\.(?!\d)))/;
const LEADING_ZERO_AS_OH_WORD = new RegExp(`^0(\\s+)(?=(?:${OH_STARTERS})\\b)`, 'i');

/**
 * 还原句首被 ASR / 文本归一化误写成数字的 I 和 Oh。
 * 只处理句首，并且要求后面跟着高置信度的上下文词，避免改动真实数字。
 */
function normalizeLeadingHomophones(text: string): string {
  if (!text) return text;

  let result = text;

  const looksNumeric =
    NUMERIC_TIME_CONTEXT.test(result) || NUMERIC_ONE_CONTEXT.test(result);
  if (!looksNumeric) {
    result = result
      .replace(LEADING_ONE_CONTRACTION, 'I$1')
      .replace(LEADING_ONE_AS_I, 'I$1');
  }

  result = result
    .replace(LEADING_ZERO_AS_OH_PUNCT, 'Oh')
    .replace(LEADING_ZERO_AS_OH_WORD, 'Oh$1');

  return result;
}

/** 清掉 ASR 偶尔带出的时间戳、分段编号，并修正句首 I/Oh 被写成 1/0 的情况。 */
export function cleanTranscript(raw: string): string {
  let text = raw.replace(/\s+/g, ' ').trim();

  for (let i = 0; i < 3; i += 1) {
    const next = text
      .replace(TIMESTAMP_PREFIX, '')
      .replace(SEGMENT_PREFIX, '')
      .replace(BARE_ONE_PREFIX, '')
      .trim();
    if (next === text) break;
    text = next;
  }

  return normalizeLeadingHomophones(text);
}
