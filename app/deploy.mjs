import { getFullnodeUrl, SuiClient } from '@onelabs/sui/client';
import { Ed25519Keypair } from '@onelabs/sui/keypairs/ed25519';
import { Transaction } from '@onelabs/sui/transactions';
import { decodeSuiPrivateKey } from '@onelabs/sui/cryptography';
import fs from 'fs';
import { execSync } from 'child_process';
import os from 'os';
import path from 'path';

async function deploy() {
  const suiPath = `D:\\InfectionX\\.tools\\sui-testnet\\sui.exe`;
  const packagePath = `D:/InfectionX/contracts/resident_system`;
  
  console.log("Building move contract...");
  let rawBuild;
  try {
    rawBuild = execSync(`${suiPath} move build --dump-bytecode-as-base64`, { cwd: packagePath, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
  } catch (e) {
    if (e.stdout) rawBuild = e.stdout.toString();
    else throw e;
  }
  
  console.log("Output Length:", rawBuild ? rawBuild.length : 0);
  console.log("Snippet:", rawBuild ? rawBuild.slice(-500) : "empty");
  
  const jsonMatch = rawBuild.match(/\{[\s\S]*"modules"[\s\S]*"dependencies"[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("Could not parse JSON from build output.");
    process.exit(1);
  }
  
  const { modules, dependencies } = JSON.parse(jsonMatch[0]);

  const keystorePath = path.join(os.homedir(), '.sui', 'sui_config', 'sui.keystore');
  const keystore = JSON.parse(fs.readFileSync(keystorePath, 'utf-8'));
  
  let keypair;
  for (const key of keystore) {
    try {
      const raw = Buffer.from(key, 'base64');
      if (raw[0] === 0) {
        const kp = Ed25519Keypair.fromSecretKey(raw.slice(1));
        if (kp.toSuiAddress() === '0x916c7accd3308e4a8ec896b51b2a0bbcd510abff0579c059455b7e30d147f05a') {
          keypair = kp;
          break;
        }
      }
    } catch {}
  }
  
  if (!keypair) {
    console.error("Could not find keypair for address in keystore.");
    process.exit(1);
  }

  const client = new SuiClient({ url: 'https://rpc-testnet.onelabs.cc:443' });

  const tx = new Transaction();
  const [upgradeCap] = tx.publish({
    modules,
    dependencies,
  });
  
  tx.transferObjects([upgradeCap], keypair.toSuiAddress());

  console.log("Signing and Executing transaction...");
  try {
    const result = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: { showEffects: true, showObjectChanges: true }
    });
    
    console.log("Transaction successfully executed!", result.digest);

    let packageId = '';
    for (const change of result.objectChanges) {
      if (change.type === 'published') {
        packageId = change.packageId;
        break;
      }
    }
    console.log("New Package ID:", packageId);
    
    // Attempt to parse out Virus state ID
    let virusStateId = '';
    for (const change of result.objectChanges) {
      if (change.type === 'created' && change.objectType.includes('virus::VirusState')) {
        virusStateId = change.objectId;
        break;
      }
    }
    console.log("VirusState ID:", virusStateId);

  } catch (err) {
    console.error("Failed to deploy:", err);
  }
}

deploy().catch(console.error);
