// SouffleurUI.tsx — эталонная версия с рабочей кнопкой загрузки
import React, { useState, useEffect, useRef, useMemo } from "react";

const mockDialogs = [
  {
    id: "dlg-1",
    title: "Дмитрий Кузнецов",
    time: "15:24",
    client: {
      name: "Дмитрий Кузнецов",
      contract: "123456",
      product: "Вклад Оптимальный",
      loyalty: "Стандартный"
    },
    messages: [
      { from: "client", text: "Здравствуйте. Мне не пришёл перевод. Можете уточнить детали?", time: "15:23" },
      { from: "operator", text: "Добрый день! Какой банк отправитель?", time: "15:24" }
    ],
    suggestions: [
      { text: "Уточните банк-отправитель", source: "KB:101", confidence: 0.85 }
    ]
  }
];

export default function SouffleurUI() {
  const [dialogs, setDialogs] = useState(mockDialogs);
  const [activeId, setActiveId] = useState(mockDialogs[0].id);
  const [operatorInput, setOperatorInput] = useState("");
  const [clientInput, setClientInput] = useState("");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newCallId, setNewCallId] = useState("");
  const [newText, setNewText] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const clientRef = useRef(null);
  const operatorRef = useRef(null);

  const filteredDialogs = useMemo(
    () => dialogs.filter(d => d.title.includes(query) || d.client.name.includes(query)),
    [dialogs, query]
  );

  const pages = Math.ceil(filteredDialogs.length / pageSize);
  const paginatedDialogs = filteredDialogs.slice((page - 1) * pageSize, page * pageSize);
  const activeDialog = useMemo(
    () => dialogs.find(d => d.id === activeId) || dialogs[0],
    [dialogs, activeId]
  );

  useEffect(() => {
    clientRef.current?.scrollTo({ top: clientRef.current.scrollHeight, behavior: "smooth" });
    operatorRef.current?.scrollTo({ top: operatorRef.current.scrollHeight, behavior: "smooth" });
  }, [activeDialog.messages]);

  const addMessage = (from, text) => {
    if (!text.trim()) return;
    const now = new Date().toTimeString().slice(0, 5);
    setDialogs(prev =>
      prev.map(d =>
        d.id === activeDialog.id
          ? { ...d, messages: [...d.messages, { from, text: text.trim(), time: now }] }
          : d
      )
    );
    if (from === "client") setClientInput("");
    else setOperatorInput("");
  };

  const addDialog = () => {
    if (!newCallId.trim() || !newText.trim()) return;
    const now = new Date();
    const msgs = newText.split(/\r?\n/).map((line, i) => {
      const t = line.trim();
      const match = t.match(/^\*\*(Клиент|Оператор)\*\*:\s*(.*)$/);
      if (!match) return null;
      const role = match[1] === "Оператор" ? "operator" : "client";
      return {
        from: role,
        text: match[2],
        time: new Date(now.getTime() + i * 60000).toTimeString().slice(0, 5)
      };
    }).filter(Boolean);

    const newDlg = {
      id: `dlg-${Date.now()}`,
      title: newCallId,
      time: now.toTimeString().slice(0, 5),
      client: { name: newCallId, contract: "-", product: "-", loyalty: "-" },
      messages: msgs,
      suggestions: []
    };
    setDialogs(prev => [newDlg, ...prev]);
    setActiveId(newDlg.id);
    setPage(1);
    setShowForm(false);
    setNewCallId("");
    setNewText("");
  };

  return (
    <>
      <div className="grid grid-cols-12 h-screen overflow-hidden">
        {/* Левая колонка */}
        <div className="col-span-2 flex flex-col border-r h-screen overflow-hidden">
          <div className="p-4 space-y-2 border-b">
            <input
              type="text"
              placeholder="Введите call_id или телефон"
              className="w-full border rounded px-2 py-1"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button
              onClick={() => setShowForm(true)}
              className="w-full bg-blue-600 text-white py-2 rounded"
            >
              Загрузить диалог
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {paginatedDialogs.map(dlg => (
              <div
                key={dlg.id}
                onClick={() => setActiveId(dlg.id)}
                className={`p-2 border rounded mb-2 cursor-pointer ${dlg.id === activeId ? "bg-gray-100" : "hover:bg-gray-50"}`}
              >
                <div className="font-medium text-sm">{dlg.title}</div>
                <div className="text-xs text-gray-500">{dlg.time}</div>
              </div>
            ))}
          </div>
          <div className="border-t px-4 py-2 text-sm flex justify-between">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="text-blue-600 disabled:text-gray-400">Назад</button>
            <span>Страница {page} из {pages}</span>
            <button disabled={page === pages} onClick={() => setPage(page + 1)} className="text-blue-600 disabled:text-gray-400">Вперёд</button>
          </div>
        </div>

        {/* Центральная часть */}
        <div className="col-span-7 flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-gray-100">
            <h2 className="text-lg font-semibold">Чат с {activeDialog.client.name}</h2>
          </div>
          <div className="flex flex-1 overflow-hidden">
            {/* Клиент */}
            <div className="w-1/2 flex flex-col border-r overflow-hidden min-h-0">
              <div className="p-2 bg-gray-50 font-medium">Окно клиента</div>
              <div ref={clientRef} className="flex-1 overflow-y-auto p-4 bg-white space-y-2">
                {activeDialog.messages.map((msg, idx) => (
                  <div key={idx} className={`p-2 rounded ${msg.from === "client" ? "bg-gray-100 text-left" : "bg-blue-600 text-white text-right ml-auto"}`}>
                    <div>{msg.text}</div>
                    <div className="text-xs text-gray-500 mt-1">{msg.time}</div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-gray-50 flex gap-2 items-center">
                <input className="flex-1 border rounded px-4 py-2" placeholder="Сообщение от клиента" value={clientInput} onChange={e => setClientInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addMessage("client", clientInput)} />
                <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => addMessage("client", clientInput)}>Отправить</button>
              </div>
            </div>
            {/* Оператор */}
            <div className="w-1/2 flex flex-col overflow-hidden min-h-0">
              <div className="p-2 bg-gray-50 font-medium">Окно оператора</div>
              <div ref={operatorRef} className="flex-1 overflow-y-auto p-4 bg-white space-y-2">
                {activeDialog.messages.map((msg, idx) => (
                  <div key={idx} className={`p-2 rounded ${msg.from === "operator" ? "bg-blue-600 text-white text-right ml-auto" : "bg-gray-100 text-left"}`}>
                    <div>{msg.text}</div>
                    <div className="text-xs text-gray-500 mt-1">{msg.time}</div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-gray-50 flex gap-2 items-center">
                <input className="flex-1 border rounded px-4 py-2" placeholder="Сообщение от оператора" value={operatorInput} onChange={e => setOperatorInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addMessage("operator", operatorInput)} />
                <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => addMessage("operator", operatorInput)}>Отправить</button>
              </div>
            </div>
          </div>
        </div>

        {/* AI-суфлёр */}
        <div className="col-span-3 flex flex-col h-screen overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="text-lg font-bold">AI-суфлёр</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
            {activeDialog.suggestions.map((sug, idx) => (
              <div key={idx} className="border rounded p-3 space-y-2">
                <div className="text-sm font-medium">{sug.text}</div>
                <div className="text-xs text-gray-500 flex justify-between">
                  {sug.source && <span>📄 {sug.source}</span>}
                  <span>{Math.round(sug.confidence * 100)}%</span>
                </div>
                <button className="text-sm mt-2 px-3 py-1 border rounded bg-blue-600 text-white" onClick={() => setOperatorInput(sug.text)}>Вставить в ответ</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Модальное окно загрузки */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-[400px] space-y-4">
            <h3 className="text-lg font-semibold">Добавить диалог вручную</h3>
            <input type="text" placeholder="call_id или номер" className="w-full border rounded px-3 py-2" value={newCallId} onChange={(e) => setNewCallId(e.target.value)} />
            <textarea rows={6} placeholder="**Клиент**: текст\n**Оператор**: текст" className="w-full border rounded px-3 py-2" value={newText} onChange={(e) => setNewText(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border rounded">Отмена</button>
              <button onClick={addDialog} className="px-4 py-2 text-sm bg-blue-600 text-white rounded">Загрузить</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
