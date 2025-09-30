import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

import 'package:crypto/crypto.dart';
import 'package:encrypt/encrypt.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class EncryptionService {
  static const String _keyStorageKey = 'encryption_master_key';
  static const _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  late final Encrypter _encrypter;
  late final Key _masterKey;

  static final EncryptionService _instance = EncryptionService._internal();
  factory EncryptionService() => _instance;
  EncryptionService._internal();

  Future<void> initialize() async {
    _masterKey = await _getOrCreateMasterKey();
    _encrypter = Encrypter(AES(_masterKey));
  }

  /// Generate or retrieve the master encryption key
  Future<Key> _getOrCreateMasterKey() async {
    try {
      final existingKey = await _secureStorage.read(key: _keyStorageKey);
      if (existingKey != null) {
        return Key.fromBase64(existingKey);
      }
    } catch (e) {
      // If reading fails, generate a new key
    }

    // Generate new master key
    final key = Key.fromSecureRandom(32);
    await _secureStorage.write(key: _keyStorageKey, value: key.base64);
    return key;
  }

  /// Encrypt text data
  EncryptedData encryptText(String plainText) {
    final iv = IV.fromSecureRandom(16);
    final encrypted = _encrypter.encrypt(plainText, iv: iv);
    return EncryptedData(
      data: encrypted.base64,
      iv: iv.base64,
    );
  }

  /// Decrypt text data
  String decryptText(EncryptedData encryptedData) {
    final encrypted = Encrypted.fromBase64(encryptedData.data);
    final iv = IV.fromBase64(encryptedData.iv);
    return _encrypter.decrypt(encrypted, iv: iv);
  }

  /// Encrypt a file and return the encrypted file path
  Future<FileEncryptionResult> encryptFile(String inputPath) async {
    final inputFile = File(inputPath);
    if (!await inputFile.exists()) {
      throw FileSystemException('Input file does not exist', inputPath);
    }

    // Generate unique IV for this file
    final iv = IV.fromSecureRandom(16);

    // Create encrypted file path
    final outputPath = '$inputPath.encrypted';
    final outputFile = File(outputPath);

    // Read input file
    final inputBytes = await inputFile.readAsBytes();

    // Encrypt the file content
    final encrypted = _encrypter.encryptBytes(inputBytes, iv: iv);

    // Write encrypted content
    await outputFile.writeAsBytes(encrypted.bytes);

    // Generate file hash for integrity verification
    final fileHash = sha256.convert(inputBytes).toString();

    return FileEncryptionResult(
      encryptedPath: outputPath,
      iv: iv.base64,
      fileHash: fileHash,
      originalSize: inputBytes.length,
      encryptedSize: encrypted.bytes.length,
    );
  }

  /// Decrypt a file and return the decrypted file path
  Future<String> decryptFile(String encryptedPath, String iv) async {
    final encryptedFile = File(encryptedPath);
    if (!await encryptedFile.exists()) {
      throw FileSystemException('Encrypted file does not exist', encryptedPath);
    }

    // Create decrypted file path
    final outputPath = encryptedPath.replaceAll('.encrypted', '.decrypted');
    final outputFile = File(outputPath);

    // Read encrypted file
    final encryptedBytes = await encryptedFile.readAsBytes();

    // Decrypt the file content
    final encrypted = Encrypted(encryptedBytes);
    final ivObj = IV.fromBase64(iv);
    final decryptedBytes = _encrypter.decryptBytes(encrypted, iv: ivObj);

    // Write decrypted content
    await outputFile.writeAsBytes(decryptedBytes);

    return outputPath;
  }

  /// Generate SHA-256 hash of a file
  Future<String> generateFileHash(String filePath) async {
    final file = File(filePath);
    if (!await file.exists()) {
      throw FileSystemException('File does not exist', filePath);
    }

    final bytes = await file.readAsBytes();
    return sha256.convert(bytes).toString();
  }

  /// Verify file integrity using hash
  Future<bool> verifyFileIntegrity(String filePath, String expectedHash) async {
    try {
      final actualHash = await generateFileHash(filePath);
      return actualHash == expectedHash;
    } catch (e) {
      return false;
    }
  }

  /// Generate a random salt for password hashing
  String generateSalt() {
    final random = Random.secure();
    final saltBytes = List<int>.generate(32, (i) => random.nextInt(256));
    return base64Encode(saltBytes);
  }

  /// Hash a password with salt
  String hashPassword(String password, String salt) {
    final saltBytes = base64Decode(salt);
    final passwordBytes = utf8.encode(password);
    final combined = [...saltBytes, ...passwordBytes];
    return sha256.convert(combined).toString();
  }

  /// Securely wipe a file by overwriting it with random data
  Future<void> secureDeleteFile(String filePath) async {
    final file = File(filePath);
    if (!await file.exists()) return;

    try {
      // Get file size
      final fileSize = await file.length();

      // Overwrite with random data (3 passes)
      final random = Random.secure();
      for (int pass = 0; pass < 3; pass++) {
        final randomData = Uint8List.fromList(
          List.generate(fileSize, (index) => random.nextInt(256))
        );
        await file.writeAsBytes(randomData, flush: true);
      }

      // Finally delete the file
      await file.delete();
    } catch (e) {
      // If secure deletion fails, try normal deletion
      await file.delete();
    }
  }

  /// Clean up temporary decrypted files
  Future<void> cleanupTemporaryFiles(String directory) async {
    try {
      final dir = Directory(directory);
      if (!await dir.exists()) return;

      await for (final entity in dir.list()) {
        if (entity is File && entity.path.endsWith('.decrypted')) {
          await secureDeleteFile(entity.path);
        }
      }
    } catch (e) {
      // Ignore errors during cleanup
    }
  }
}

class EncryptedData {
  final String data;
  final String iv;

  const EncryptedData({
    required this.data,
    required this.iv,
  });

  Map<String, String> toJson() => {
    'data': data,
    'iv': iv,
  };

  factory EncryptedData.fromJson(Map<String, String> json) => EncryptedData(
    data: json['data']!,
    iv: json['iv']!,
  );
}

class FileEncryptionResult {
  final String encryptedPath;
  final String iv;
  final String fileHash;
  final int originalSize;
  final int encryptedSize;

  const FileEncryptionResult({
    required this.encryptedPath,
    required this.iv,
    required this.fileHash,
    required this.originalSize,
    required this.encryptedSize,
  });
}