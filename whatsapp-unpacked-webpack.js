window.Store = Object.assign({}, window.require("WAWebCollections"));
window.Store.AppState = window.require("WAWebSocketModel").Socket;
window.Store.BlockContact = window.require("WAWebBlockContactAction");
window.Store.Conn = window.require("WAWebConnModel").Conn;
window.Store.Cmd = window.require("WAWebCmd").Cmd;
window.Store.DownloadManager = window.require(
  "WAWebDownloadManager"
).downloadManager;
window.Store.GroupQueryAndUpdate =
  window.require("WAWebGroupQueryJob").queryAndUpdateGroupMetadataById;
window.Store.MediaPrep = window.require("WAWebPrepRawMedia");
window.Store.MediaObject = window.require("WAWebMediaStorage");
window.Store.MediaTypes = window.require("WAWebMmsMediaTypes");
window.Store.MediaUpload = window.require("WAWebMediaMmsV4Upload");
window.Store.MsgKey = window.require("WAWebMsgKey");
window.Store.NumberInfo = window.require("WAPhoneUtils");
window.Store.OpaqueData = window.require("WAWebMediaOpaqueData");
window.Store.QueryProduct = window.require("WAWebBizProductCatalogBridge");
window.Store.QueryOrder = window.require("WAWebBizOrderBridge");
window.Store.SendClear = window.require("WAWebChatClearBridge");
window.Store.SendDelete = window.require("WAWebDeleteChatAction");
window.Store.SendMessage = window.require("WAWebSendMsgChatAction");
window.Store.EditMessage = window.require("WAWebSendMessageEditAction");
window.Store.SendSeen = window.require("WAWebUpdateUnreadChatAction");
window.Store.User = window.require("WAWebUserPrefsMeUser");
window.Store.ContactMethods = window.require("WAWebContactGetters");
window.Store.UploadUtils = window.require("WAWebUploadManager");
window.Store.UserConstructor = window.require("WAWebWid");
window.Store.Validators = window.require("WALinkify");
window.Store.VCard = window.require("WAWebFrontendVcardUtils");
window.Store.WidFactory = window.require("WAWebWidFactory");
window.Store.ProfilePic = window.require("WAWebContactProfilePicThumbBridge");
window.Store.PresenceUtils = window.require("WAWebPresenceChatAction");
window.Store.ChatState = window.require("WAWebChatStateBridge");
window.Store.findCommonGroups = window.require(
  "WAWebFindCommonGroupsContactAction"
).findCommonGroups;
window.Store.StatusUtils = window.require("WAWebContactStatusBridge");
window.Store.ConversationMsgs = window.require("WAWebChatLoadMessages");
window.Store.sendReactionToMsg = window.require(
  "WAWebSendReactionMsgAction"
).sendReactionToMsg;
window.Store.createOrUpdateReactionsModule = window.require(
  "WAWebDBCreateOrUpdateReactions"
);
window.Store.EphemeralFields = window.require(
  "WAWebGetEphemeralFieldsMsgActionsUtils"
);
window.Store.MsgActionChecks = window.require("WAWebMsgActionCapability");
window.Store.QuotedMsg = window.require("WAWebQuotedMsgModelUtils");
window.Store.LinkPreview = window.require("WAWebLinkPreviewChatAction");
window.Store.Socket = window.require("WADeprecatedSendIq");
window.Store.SocketWap = window.require("WAWap");
window.Store.SearchContext = window.require(
  "WAWebChatMessageSearch"
).getSearchContext;
window.Store.DrawerManager = window.require("WAWebDrawerManager").DrawerManager;
window.Store.LidUtils = window.require("WAWebApiContact");
window.Store.WidToJid = window.require("WAWebWidToJid");
window.Store.JidToWid = window.require("WAWebJidToWid");
window.Store.getMsgInfo = window.require(
  "WAWebApiMessageInfoStore"
).queryMsgInfo;
window.Store.pinUnpinMsg = window.require(
  "WAWebSendPinMessageAction"
).sendPinInChatMsg;
window.Store.QueryExist = window.require("WAWebQueryExistsJob").queryWidExists;
window.Store.ReplyUtils = window.require("WAWebMsgReply");
window.Store.Settings = window.require("WAWebUserPrefsGeneral");
window.Store.BotSecret = window.require("WAWebBotMessageSecret");
window.Store.BotProfiles = window.require("WAWebBotProfileCollection");
window.Store.DeviceList = window.require("WAWebApiDeviceList");
window.Store.HistorySync = window.require("WAWebSendNonMessageDataRequest");

const compareWwebVersions = (lOperand, operator, rOperand) => {
  if (![">", ">=", "<", "<=", "="].includes(operator)) {
    throw new (class _ extends Error {
      constructor(m) {
        super(m);
        this.name = "CompareWwebVersionsError";
      }
    })("Invalid comparison operator is provided");
  }
  if (typeof lOperand !== "string" || typeof rOperand !== "string") {
    throw new (class _ extends Error {
      constructor(m) {
        super(m);
        this.name = "CompareWwebVersionsError";
      }
    })("A non-string WWeb version type is provided");
  }

  lOperand = lOperand.replace(/-beta$/, "");
  rOperand = rOperand.replace(/-beta$/, "");

  while (lOperand.length !== rOperand.length) {
    lOperand.length > rOperand.length
      ? (rOperand = rOperand.concat("0"))
      : (lOperand = lOperand.concat("0"));
  }

  lOperand = Number(lOperand.replace(/\./g, ""));
  rOperand = Number(rOperand.replace(/\./g, ""));

  return operator === ">"
    ? lOperand > rOperand
    : operator === ">="
    ? lOperand >= rOperand
    : operator === "<"
    ? lOperand < rOperand
    : operator === "<="
    ? lOperand <= rOperand
    : operator === "="
    ? lOperand === rOperand
    : false;
};

const getMessageModel = (message) => {
  const msg = message.serialize();

  msg.isEphemeral = message.isEphemeral;
  msg.isStatusV3 = message.isStatusV3;
  msg.links = window.Store.Validators.findLinks(
    message.mediaObject ? message.caption : message.body
  ).map((link) => ({
    link: link.href,
    isSuspicious: Boolean(
      link.suspiciousCharacters && link.suspiciousCharacters.size
    )
  }));

  if (msg.buttons) {
    msg.buttons = msg.buttons.serialize();
  }
  if (msg.dynamicReplyButtons) {
    msg.dynamicReplyButtons = JSON.parse(
      JSON.stringify(msg.dynamicReplyButtons)
    );
  }
  if (msg.replyButtons) {
    msg.replyButtons = JSON.parse(JSON.stringify(msg.replyButtons));
  }

  if (typeof msg.id.remote === "object") {
    msg.id = Object.assign({}, msg.id, {
      remote: msg.id.remote._serialized
    });
  }

  delete msg.pendingAckUpdate;

  return msg;
};

const getChatModel = async (chat) => {
  let res = chat.serialize();
  res.isGroup = false;
  res.formattedTitle = chat.formattedTitle;
  res.isMuted = chat.muteExpiration == 0 ? false : true;

  if (chat.groupMetadata) {
    res.isGroup = true;
    const chatWid = window.Store.WidFactory.createWid(chat.id._serialized);
    await window.Store.GroupMetadata.update(chatWid);
    res.groupMetadata = chat.groupMetadata.serialize();
  }

  res.lastMessage = null;
  if (res.msgs && res.msgs.length) {
    const lastMessage = chat.lastReceivedKey
      ? window.Store.Msg.get(chat.lastReceivedKey._serialized) ||
        (
          await window.Store.Msg.getMessagesById([
            chat.lastReceivedKey._serialized
          ])
        )?.messages?.[0]
      : null;
    if (lastMessage) {
      res.lastMessage = getMessageModel(lastMessage);
    }
  }

  delete res.msgs;
  delete res.msgUnsyncedButtonReplyMsgs;
  delete res.unsyncedButtonReplies;

  return res;
};

///////////////////////////////////////////////////////////////////////////////////////////////
const getFileHash = async (data) => {
  let buffer = await data.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
};

const generateHash = async (length) => {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const mediaInfoToFile = ({ data, mimetype, filename }) => {
  const binaryData = window.atob(data);

  const buffer = new ArrayBuffer(binaryData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binaryData.length; i++) {
    view[i] = binaryData.charCodeAt(i);
  }

  const blob = new Blob([buffer], { type: mimetype });
  return new File([blob], filename, {
    type: mimetype,
    lastModified: Date.now()
  });
};

const generateWaveform = async (audioFile) => {
  try {
    const audioData = await audioFile.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(audioData);

    const rawData = audioBuffer.getChannelData(0);
    const samples = 64;
    const blockSize = Math.floor(rawData.length / samples);
    const filteredData = [];
    for (let i = 0; i < samples; i++) {
      const blockStart = blockSize * i;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum = sum + Math.abs(rawData[blockStart + j]);
      }
      filteredData.push(sum / blockSize);
    }

    const multiplier = Math.pow(Math.max(...filteredData), -1);
    const normalizedData = filteredData.map((n) => n * multiplier);

    const waveform = new Uint8Array(
      normalizedData.map((n) => Math.floor(100 * n))
    );

    return waveform;
  } catch (e) {
    return undefined;
  }
};

const processStickerData = async (mediaInfo) => {
  if (mediaInfo.mimetype !== "image/webp")
    throw new Error("Invalid media type");

  const file = mediaInfoToFile(mediaInfo);
  let filehash = await getFileHash(file);
  let mediaKey = await generateHash(32);

  const controller = new AbortController();
  const uploadedInfo = await window.Store.UploadUtils.encryptAndUpload({
    blob: file,
    type: "sticker",
    signal: controller.signal,
    mediaKey
  });

  const stickerInfo = {
    ...uploadedInfo,
    clientUrl: uploadedInfo.url,
    deprecatedMms3Url: uploadedInfo.url,
    uploadhash: uploadedInfo.encFilehash,
    size: file.size,
    type: "sticker",
    filehash
  };

  return stickerInfo;
};

const processMediaData = async (
  mediaInfo,
  { forceVoice, forceDocument, forceGif }
) => {
  const file = mediaInfoToFile(mediaInfo);
  const mData = await window.Store.OpaqueData.createFromData(file, file.type);
  const mediaPrep = window.Store.MediaPrep.prepRawMedia(mData, {
    asDocument: forceDocument
  });
  const mediaData = await mediaPrep.waitForPrep();
  const mediaObject = window.Store.MediaObject.getOrCreateMediaObject(
    mediaData.filehash
  );

  const mediaType = window.Store.MediaTypes.msgToMediaType({
    type: mediaData.type,
    isGif: mediaData.isGif
  });

  if (forceVoice && mediaData.type === "audio") {
    mediaData.type = "ptt";
    const waveform = mediaObject.contentInfo.waveform;
    mediaData.waveform = waveform ?? (await generateWaveform(file));
  }

  if (forceGif && mediaData.type === "video") {
    mediaData.isGif = true;
  }

  if (forceDocument) {
    mediaData.type = "document";
  }

  if (!(mediaData.mediaBlob instanceof window.Store.OpaqueData)) {
    mediaData.mediaBlob = await window.Store.OpaqueData.createFromData(
      mediaData.mediaBlob,
      mediaData.mediaBlob.type
    );
  }

  mediaData.renderableUrl = mediaData.mediaBlob.url();
  mediaObject.consolidate(mediaData.toJSON());
  mediaData.mediaBlob.autorelease();

  const uploadedMedia = await window.Store.MediaUpload.uploadMedia({
    mimetype: mediaData.mimetype,
    mediaObject,
    mediaType
  });

  const mediaEntry = uploadedMedia.mediaEntry;
  if (!mediaEntry) {
    throw new Error("upload failed: media entry was not created");
  }

  mediaData.set({
    clientUrl: mediaEntry.mmsUrl,
    deprecatedMms3Url: mediaEntry.deprecatedMms3Url,
    directPath: mediaEntry.directPath,
    mediaKey: mediaEntry.mediaKey,
    mediaKeyTimestamp: mediaEntry.mediaKeyTimestamp,
    filehash: mediaObject.filehash,
    encFilehash: mediaEntry.encFilehash,
    uploadhash: mediaEntry.uploadHash,
    size: mediaObject.size,
    streamingSidecar: mediaEntry.sidecar,
    firstFrameSidecar: mediaEntry.firstFrameSidecar
  });

  return mediaData;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////

// window.WPP.contact.queryExists(numberId);
async function contactExists(number) {
  const STORAGE_KEY = "crm-cached-contacts";
  const getCachedContacts = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  };
  const setCachedContacts = (arr) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  };

  let cachedContacts = getCachedContacts();

  // Processa o número recebido
  let numberId = number;
  numberId = numberId.replace(/\D/g, "");
  if (numberId.length === 13 || numberId.length === 12)
    numberId = numberId.slice(2);

  if (numberId.length === 10)
    numberId = `${numberId.slice(0, 2)}9${numberId.slice(2)}`;
  if (numberId.length === 11) numberId = `55${numberId}`;
  if (!numberId.includes("@")) numberId = `${numberId}@c.us`;

  const candidateWith9 = numberId;

  let candidateWithout9;
  if (numberId.length === 18) {
    const modNumberId = `${numberId.slice(0, 4)}${numberId.slice(4)}`;
    candidateWithout9 = `${modNumberId.slice(0, 4)}${modNumberId.slice(5)}`;
  } else {
    candidateWithout9 = `${numberId.slice(0, 4)}${numberId.slice(5)}`;
  }

  const ddd = parseInt(numberId.slice(2, 4));
  const dddLimit = 30;

  if (cachedContacts.includes(candidateWith9)) {
    console.log(`cacheado`);
    return candidateWith9;
  }
  if (cachedContacts.includes(candidateWithout9)) {
    console.log(`cacheado`);
    return candidateWithout9;
  }

  let resultSerialized = false;
  if (ddd < dddLimit) {
    console.log(`requisitou`);
    const existsWith9 = await window.Store.Chat.get(candidateWith9);
    if (existsWith9) {
      resultSerialized = existsWith9.__x_id._serialized;
    } else {
      let adjustedNumberId = numberId;
      if (numberId.length === 18) {
        adjustedNumberId = `${numberId.slice(0, 4)}${numberId.slice(4)}`;
      }
      const candidateWithout = `${adjustedNumberId.slice(
        0,
        4
      )}${adjustedNumberId.slice(5)}`;
      console.log(`requisitou`);
      const existsWithout9 = await window.Store.Chat.get(candidateWithout);
      if (existsWithout9) {
        resultSerialized = existsWithout9.__x_id._serialized;
      }
    }
  } else {
    let adjustedNumberId = numberId;
    if (numberId.length === 18) {
      adjustedNumberId = `${numberId.slice(0, 4)}${numberId.slice(4)}`;
    }
    const candidateWithout = `${adjustedNumberId.slice(
      0,
      4
    )}${adjustedNumberId.slice(5)}`;
    console.log(`requisitou`);
    const existsWithout9 = await window.Store.Chat.get(candidateWithout);
    if (existsWithout9) {
      resultSerialized = existsWithout9.__x_id._serialized;
    } else {
      console.log(`requisitou`);
      const existsWith9 = await window.Store.Chat.get(candidateWith9);
      if (existsWith9) {
        resultSerialized = existsWith9.__x_id._serialized;
      }
    }
  }

  if (resultSerialized) {
    if (!cachedContacts.includes(resultSerialized)) {
      cachedContacts.push(resultSerialized);
      setCachedContacts(cachedContacts);
    }
    return resultSerialized;
  }

  return false;
}

// window.WPP.conn.getMyUserId();
async function getMyUser() {
  await window.Store.User.getMaybeMeUser();
}

// window.WPP.chat.sendFileMessage
async function sendMessage(chatId, content, options = {}) {
  const realChatId = await contactExists(chatId);
  if (!realChatId) return false;
  const chatWid = window.Store.WidFactory.createWid(realChatId);
  const chat = await window.Store.Chat.find(chatWid);

  let attOptions = {};
  if (options.attachment) {
    attOptions = options.sendMediaAsSticker
      ? await processStickerData(options.attachment)
      : await processMediaData(options.attachment, {
          forceVoice: options.sendAudioAsVoice,
          forceDocument: options.sendMediaAsDocument,
          forceGif: options.sendVideoAsGif
        });

    attOptions.caption = options.caption;
    content = options.sendMediaAsSticker ? undefined : attOptions.preview;
    attOptions.isViewOnce = options.isViewOnce;

    delete options.attachment;
    delete options.sendMediaAsSticker;
  }
  let quotedMsgOptions = {};

  const botOptions = {};

  const meUser = window.Store.User.getMaybeMeUser();
  const newId = await window.Store.MsgKey.newId();

  const newMsgId = new window.Store.MsgKey({
    from: meUser,
    to: chat.id,
    id: newId,
    participant: chat.id.isGroup() ? meUser : undefined,
    selfDir: "out"
  });

  const extraOptions = {};
  delete options.extraOptions;

  const ephemeralFields = window.Store.EphemeralFields.getEphemeralFields(chat);
  const message = {
    ...options,
    id: newMsgId,
    ack: 0,
    body: content,
    from: meUser,
    to: chat.id,
    local: true,
    self: "out",
    t: parseInt(new Date().getTime() / 1000),
    isNewMsg: true,
    type: "chat",
    ...ephemeralFields,
    ...locationOptions,
    ..._pollOptions,
    ...attOptions,
    ...(attOptions.toJSON ? attOptions.toJSON() : {}),
    ...quotedMsgOptions,
    ...vcardOptions,
    ...buttonOptions,
    ...listOptions,
    ...botOptions,
    ...extraOptions
  };
  await window.Store.SendMessage.addAndSendMsgToChat(chat, message);
  return window.Store.Msg.get(newMsgId._serialized);
}

// window.WPP.contact.getProfilePictureUrl(numberId);
async function getProfileImage(contactId) {
  const realChatId = await contactExists(contactId);
  if (!realChatId) return false;
  const chatWid = window.Store.WidFactory.createWid(realChatId);
  return compareWwebVersions(window.Debug.VERSION, "<", "2.3000.0")
    ? await window.Store.ProfilePic.profilePicFind(chatWid)
    : await window.Store.ProfilePic.requestProfilePicFromServer(chatWid);
}

// window.WPP.chat.getActiveChat();
async function getActiveChat() {
  return await window.Store.Chat.getActive();
}

// window.WPP.chat.list();
async function getChats() {
  const chats = window.Store.Chat.getModelsArray();
  const chatPromises = chats.map((chat) => getChatModel(chat));
  return await Promise.all(chatPromises);
}

// window.WPP.chat.openChatBottom(numberId);
async function openChat(numberId) {
  const realChatId = await contactExists(numberId);
  if (!realChatId) return false;
  const chatWid = window.Store.WidFactory.createWid(realChatId);
  const chat =
    window.Store.Chat.get(chatWid) || (await window.Store.Chat.find(chatWid));
  await window.Store.Cmd.openChatBottom(chat);
  return true;
}

// window.WPP.chat.closeChat();
async function closeChat() {
  const id = (await getActiveChat()).__x_id?._serialized || undefined;
  if (!id) return false;
  const chatWid = window.Store.WidFactory.createWid(id);
  const chat =
    window.Store.Chat.get(chatWid) || (await window.Store.Chat.find(chatWid));
  await window.Store.Cmd.closeChat(chat);
  return true;
}

// window.WPP.on("chat.active_chat", (chat) => {});
window.Store.Chat.on("get_conversation_header_offset", async () => {
  const chat = await getActiveChat();
  activeChatEvent(chat);
});
