# LSP Server Architecture Refactoring

## 概要

LSP
サーバーのアーキテクチャを責務分離原則に基づいて大規模リファクタリングしました。特に型定義、I/O
処理、ビジネスロジックを明確に分離し、保守性と再利用性を向上させました。

## 実装内容

### 1. ハンドラーの分割と整理

**ファイル構成：**

```
src/handlers/
├── initialize.ts                    # initialize メソッド処理
├── initialize_test.ts               # initialize のテスト
├── textDocument_definition.ts        # textDocument/definition メソッド処理
└── textDocument_definition_test.ts   # textDocument/definition のテスト
```

**実装内容：**

- メソッド名をファイル名に反映（`definition.ts` → `textDocument_definition.ts`）
- 各ハンドラーは `JsonRpcResponse` を返す（I/O 処理なし）
- ビジネスロジックのみに専念

**テスト追加：**

- `initialize_test.ts`：2 つのテストケース
  - ID 有りの initialize リクエスト
  - ID なしの initialize リクエスト
- `textDocument_definition_test.ts`：3 つのテストケース
  - リンクが見つからない場合
  - 行位置が範囲外の場合
  - 有効なリンクがある場合

### 2. メッセージング機能の統合

**従来の問題：**

```
readMessage() を startLspServer で、writeMessage() を processRequest で呼び出し
→ メッセージ I/O が分散している
```

**改善後：**

```
startLspServer で readMessage() と writeMessage() の両方を呼び出し
→ メッセージの読み書きが統一
```

### 3. 型定義とロジックの分離（パターン A）

**ファイル構成：**

```
src/
├── types/
│   ├── jsonrpc.ts                 # JSON-RPC ジェネリック型定義
│   └── lsp.ts                     # LSP 固有の型（LspContext）
├── io/
│   └── message.ts                 # JSON-RPC メッセージ I/O
└── lsp_server.ts                  # メインロジック
```

**各ファイルの責務：**

- `types/jsonrpc.ts`：JSON-RPC プロトコルの型定義とバリデーター
  - JsonRpcRequest, JsonRpcResponse
  - arktype を使用した実行時バリデーション
  - 他プロジェクトで再利用可能

- `types/lsp.ts`：LSP サーバー固有の型定義
  - LspContext インターフェース
  - キャッシュディレクトリ設定

- `io/message.ts`：JSON-RPC メッセージの読み書き
  - readMessage()：stdin からメッセージを読み込み
  - writeMessage()：stdout へレスポンスを送信

- `lsp_server.ts`：メインサーバーロジック
  - リクエスト検証
  - ハンドラー呼び出し
  - エラーハンドリング

### 4. エラーハンドリングの階層化

**階層：**

1. `startLspServer`：JSON パース エラー
2. `processRequest`：ハンドラー実行時エラー（try-catch）
3. ハンドラー：ビジネスロジック（エラーは上層に委譲）

**エラーコード：**

- `-32601`：メソッド未実装
- `-32603`：ハンドラー実行時内部エラー

### 5. 型チェックガイドラインの追加

AGENTS.md に以下を記載：

```
- `as` による型キャストを禁止
- `typeof` と `in` 演算子による runtime type check を推奨
- arktype の `instanceof type.errors` による検証
```

## アーキテクチャの改善点

### 責務の分離

| レイヤー         | 責務                   | ファイル        |
| ---------------- | ---------------------- | --------------- |
| I/O              | メッセージ読み書き     | `io/message.ts` |
| ビジネスロジック | リクエスト処理         | `lsp_server.ts` |
| ハンドラー       | LSP メソッド実装       | `handlers/*.ts` |
| 型定義           | 型定義・バリデーション | `types/*.ts`    |

### 依存関係（一方向）

```
handlers/ → types/ → io/
lsp_server.ts → handlers/, types/, io/
main.ts → lsp_server.ts, types/lsp.ts
```

## テスト結果

✅ **全 23 テスト合格**

```
- cache_test.ts: 2 テスト
- fetcher_test.ts: 7 テスト
- handlers/initialize_test.ts: 2 テスト（新規）
- handlers/textDocument_definition_test.ts: 3 テスト（新規）
- link_parser_test.ts: 6 テスト
- lsp_server_test.ts: 3 テスト
```

✅ **カバレッジ**

- handlers/initialize.ts: 100%
- handlers/textDocument_definition.ts: 68.3%
- types/jsonrpc.ts: 100%
- link_parser.ts: 100%
- 全体: 70.8%

✅ **品質チェック**

- Deno フォーマット：合格
- Deno リント：合格
- 型チェック：合格

## 技術的な決定

### 1. パターン A を選択した理由

- **再利用性**：JSON-RPC 型定義が独立している
- **保守性**：ファイルサイズが適切、責務が明確
- **拡張性**：新しいハンドラーやメソッド追加が容易
- **テスト性**：各要素を独立してテスト可能

### 2. validator の別名インポート

```typescript
import { JsonRpcRequest as JsonRpcRequestValidator } from "./types/jsonrpc.ts";
```

型定義と実行時バリデーターを区別するため。

### 3. I/O の統一

`startLspServer` で読み書きを行うことで、メッセージング管理が一箇所に集約。

## ファイル変更サマリー

**新規作成：**

- `src/types/jsonrpc.ts`
- `src/types/lsp.ts`
- `src/io/message.ts`
- `src/handlers/initialize_test.ts`
- `src/handlers/textDocument_definition_test.ts`
- `ARCHITECTURE.md`

**リネーム：**

- `src/handlers/definition.ts` → `src/handlers/textDocument_definition.ts`
- `src/handlers/definition_test.ts` →
  `src/handlers/textDocument_definition_test.ts`

**削除：**

- `src/message.ts`（機能を `types/jsonrpc.ts` と `io/message.ts` に分割）
- `src/handlers/index.ts`（直接インポートに変更）

**修正：**

- `src/lsp_server.ts`：新しい型構成に対応
- `src/handlers/initialize.ts`：インポートパス修正
- `src/handlers/textDocument_definition.ts`：インポートパス修正
- `main.ts`：LspContext のインポート元を message.ts から types/lsp.ts に変更

## 学習ポイント

1. **責務分離の重要性**：型定義、I/O、ロジックを分離することで保守性が大幅に向上
2. **ファイル構成の設計**：関連ファイルをディレクトリにまとめ、依存関係を明確にする
3. **型安全性**：arktype を活用した runtime validation で type safety を実現

## 今後の拡張性

現在のアーキテクチャであれば、以下の拡張が容易：

- 新しい LSP メソッドハンドラーの追加（`src/handlers/` に新規ファイル）
- 新しいメッセージ型の定義（`src/types/` に追加）
- カスタムバリデーションルール（`src/types/jsonrpc.ts` に追加）
- 他プロジェクトでの JSON-RPC 型定義の再利用

## 結論

責務分離原則に基づいたアーキテクチャリファクタリングにより、以下を実現：

✅ 保守性向上（各ファイルの責務が明確） ✅ 再利用性向上（JSON-RPC 部分が独立）
✅ テスト性向上（ユニットテスト追加） ✅ 拡張性向上（新機能追加が容易） ✅
コード品質向上（全テスト合格、型チェック合格）
