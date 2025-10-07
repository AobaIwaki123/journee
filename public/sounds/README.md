# 効果音ファイル

このディレクトリには、Journeeアプリケーションで使用する効果音ファイルを配置します。

## 必要な効果音ファイル

以下のファイルを配置してください（.mp3 または .wav 形式）：

| ファイル名 | 用途 | 推奨長さ | 推奨音質 |
|-----------|------|---------|---------|
| `notification.mp3` | AI返信通知音 | 0.5-1.0秒 | 心地よいチャイム、ベル音 |
| `send.mp3` | メッセージ送信音 | 0.2-0.5秒 | 軽快なクリック音、ポップ音 |
| `update.mp3` | しおり更新音 | 0.3-0.7秒 | 成功を示すポジティブな効果音 |
| `error.mp3` | エラー通知音 | 0.3-0.7秒 | 注意を促すアラート音（過度に不快でないもの） |
| `success.mp3` | 成功通知音（汎用） | 0.5-1.0秒 | 達成感のある効果音 |

## 効果音の推奨仕様

- **ファイル形式**: MP3（推奨）または WAV
- **ビットレート**: 128kbps 以上
- **サンプリングレート**: 44.1kHz
- **ファイルサイズ**: 各ファイル 50KB 以下（高速読み込みのため）
- **音量**: 正規化済み（-3dB 程度のヘッドルーム）

## 効果音の入手先（フリー素材）

以下のサイトから無料で商用利用可能な効果音をダウンロードできます：

- **Pixabay**: https://pixabay.com/sound-effects/
- **Freesound**: https://freesound.org/
- **Zapsplat**: https://www.zapsplat.com/
- **効果音ラボ**: https://soundeffect-lab.info/
- **DOVA-SYNDROME**: https://dova-s.jp/

## 注意事項

- 効果音ファイルがない場合、アプリは正常に動作しますが音は再生されません
- ライセンスを確認し、商用利用可能な音源を使用してください
- ファイル名は上記の名前と完全に一致させてください（大文字小文字を含む）

## 開発用ダミーファイル

開発・テスト時には、以下のコマンドで無音のダミーファイルを生成できます：

```bash
# 0.5秒の無音MP3ファイルを生成（ffmpegが必要）
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.5 -q:a 9 -acodec libmp3lame notification.mp3
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.3 -q:a 9 -acodec libmp3lame send.mp3
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.5 -q:a 9 -acodec libmp3lame update.mp3
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.5 -q:a 9 -acodec libmp3lame error.mp3
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.5 -q:a 9 -acodec libmp3lame success.mp3
```

または、シンプルに空のMP3ファイルを作成（音は鳴りません）：

```bash
touch notification.mp3 send.mp3 update.mp3 error.mp3 success.mp3
```

## 実装状態

効果音システムは Phase 3.6 で実装されており、以下のコンポーネントで管理されています：

- `lib/sound/SoundManager.ts` - 音声再生・音量制御ユーティリティ
- `components/sound/SoundProvider.tsx` - React Context による音声管理
- `lib/store/useStore.ts` - 音声設定状態管理（soundEnabled, soundVolume）