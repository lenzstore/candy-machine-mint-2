import { useEffect, useState } from "react";
import styled from "styled-components";
import Countdown from "react-countdown";
import { Button, CircularProgress, Snackbar } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import car from "./car-image.png"

import * as anchor from "@project-serum/anchor";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletDialogButton } from "@solana/wallet-adapter-material-ui";

import {
  CandyMachine,
  awaitTransactionSignatureConfirmation,
  getCandyMachineState,
  mintOneToken,
  shortenAddress,
} from "./candy-machine";

const ConnectButton = styled(WalletDialogButton)`
  heigth: 5px;
  width: 170px;
  margin-right: 25px;`;

const CounterText = styled.span``; // add your styles here

const HeaderContainer = styled.div`
  display: flex;
  background-color: #4E3673;
  text-align: center;
  flex-direction: row`;

const AccountContainer = styled.div`
  margin-right: 20px;
  margin-top: 10px;
  margin-bottom: 10px;
  text-align: center;
  background-color: slateblue;
  border: 2px solid slateblue;
  border-radius: 15px;`;

  
const MintContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 500px;
  background-color: #D8C1FA;
  justify-content: center;
  align-items: center;`;
  
const ImageContainer = styled.div`
  height: 256px`;

const MintButton = styled(Button)``;

const SocialButton = styled(Button)`
  background: white;
  width: 24px;
  heigth: 24px;
  border: none;
  outline: none;
  cursor: pointer;
  opacity: 1;`;

const RoadmapContainer = styled.div`
  display: flex;
  height: 420px;
  background-color: #D8C1FA;
  flex-direction: row;`;

const RarityContainer = styled.div`
  display: flex;
  heigth: 500px;
  background-color: #D8C1FA;
  text-align: center;
  flex-direction: column;`;

export interface HomeProps {
  candyMachineId: anchor.web3.PublicKey;
  config: anchor.web3.PublicKey;
  connection: anchor.web3.Connection;
  startDate: number;
  treasury: anchor.web3.PublicKey;
  txTimeout: number;
}

const Home = (props: HomeProps) => {
  const [balance, setBalance] = useState<number>();
  const [isActive, setIsActive] = useState(false); // true when countdown completes
  const [isSoldOut, setIsSoldOut] = useState(false); // true when items remaining is zero
  const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT
  const [availableItems, setAvailable] = useState(10000);

  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });

  const [startDate, setStartDate] = useState(new Date(props.startDate));

  const wallet = useWallet();
  const [candyMachine, setCandyMachine] = useState<CandyMachine>();

  const onMint = async () => {
    try {
      setIsMinting(true);
      if (wallet.connected && candyMachine?.program && wallet.publicKey) {
        const mintTxId = await mintOneToken(
          candyMachine,
          props.config,
          wallet.publicKey,
          props.treasury
        );

        const status = await awaitTransactionSignatureConfirmation(
          mintTxId,
          props.txTimeout,
          props.connection,
          "singleGossip",
          false
        );

        if (!status?.err) {
          setAlertState({
            open: true,
            message: "Congratulations! Mint succeeded!",
            severity: "success",
          });
        } else {
          setAlertState({
            open: true,
            message: "Mint failed! Please try again!",
            severity: "error",
          });
        }
      }
    } catch (error: any) {
      // TODO: blech:
      let message = error.msg || "Minting failed! Please try again!";
      if (!error.msg) {
        if (error.message.indexOf("0x138")) {
        } else if (error.message.indexOf("0x137")) {
          message = `SOLD OUT!`;
        } else if (error.message.indexOf("0x135")) {
          message = `Insufficient funds to mint. Please fund your wallet.`;
        }
      } else {
        if (error.code === 311) {
          message = `SOLD OUT!`;
          setIsSoldOut(true);
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        }
      }

      setAlertState({
        open: true,
        message,
        severity: "error",
      });
    } finally {
      if (wallet?.publicKey) {
        const balance = await props.connection.getBalance(wallet?.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
      setIsMinting(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (wallet?.publicKey) {
        const balance = await props.connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
    })();
  }, [wallet, props.connection]);

  useEffect(() => {
    (async () => {
      if (
        !wallet ||
        !wallet.publicKey ||
        !wallet.signAllTransactions ||
        !wallet.signTransaction
      ) {
        return;
      }

      const anchorWallet = {
        publicKey: wallet.publicKey,
        signAllTransactions: wallet.signAllTransactions,
        signTransaction: wallet.signTransaction,
      } as anchor.Wallet;

      const { candyMachine, goLiveDate, itemsRemaining, itemsAvailable } =
        await getCandyMachineState(
          anchorWallet,
          props.candyMachineId,
          props.connection,
        );
      
      setAvailable(itemsAvailable );
      setIsSoldOut(itemsRemaining === 0);
      setStartDate(goLiveDate);
      setCandyMachine(candyMachine);
    })();
  }, [wallet, props.candyMachineId, props.connection]);

  return (
    <main style={{backgroundColor: '#D8C1FA'}}>
      {wallet.connected &&
        <HeaderContainer>
            {wallet.connected && 
            <div style={{flex: 1.7, marginTop: 20}}>
              <img className="connectedLogo" src="https://i.hizliresim.com/7fzua4c.png" alt={""} width="64" height="64" style={{backgroundColor: "#4E3673",borderRadius: 50}}/>
            </div>}

            {wallet.connected && (
            <p style={{color: "white", fontSize: 30,flex: 5, fontWeight: 'bold'}}> NFTofasch</p>
            )}

            <div style={{flex: 0.15, flexDirection: "column", alignContent: 'center'}}>
              
              <div style={{marginTop: 30}}>
                <SocialButton onClick={(e) => {
                  window.open("http://twitter.com/torrhen3", "_blank")
                }}>
                  <img className="twitterButton" src="https://i.hizliresim.com/3yr3vgc.png" 
                    alt={"Twitter"} width="20" height="16"/>
                </SocialButton>
              </div>

              <div>
                <SocialButton onClick={(e) => {
                  window.open("http://discord.com", "_blank")
                }}>
                  <img className="twitterButton" src="https://i.hizliresim.com/11plsxr.png" 
                    alt={"Twitter"} width="20" height="24"/>
                </SocialButton>
              </div>
              
            </div>

            <div style={{ flex: 1.2,display: "flex", flexDirection: "column",textAlign: "right"}}>  
              <AccountContainer>
                {wallet.connected && (
                  <p style={{color: 'white'}}>Address: {shortenAddress(wallet.publicKey?.toBase58() || "")}</p>
                )}

                {wallet.connected && (
                  <p style={{color: 'white'}}>Balance: {(balance || 0).toLocaleString()} SOL</p>
                )}
              </AccountContainer>
            </div>
        </HeaderContainer>}
      
        {!wallet.connected &&
          <HeaderContainer>
            
            <div style={{flex: 1.15, marginTop: 20}}>
              <img className="connectedLogo" src="https://i.hizliresim.com/7fzua4c.png" alt={""} width="64" height="64" style={{borderRadius: 50}}/>
            </div>
            
            <p style={{color: "white", fontSize: 30,flex: 5, fontWeight: 'bold'}}> NFTofasch</p>
            
            <div style={{flex: 0.15}}></div>

            <div style={{flex: 1, marginTop: 30}}>
              <ConnectButton>Connect Wallet</ConnectButton>
            </div>
          </HeaderContainer>
        }

        {wallet.connected &&
        <MintContainer>
          
          <ImageContainer>
            <img className="car" src='https://i.hizliresim.com/l95qj5x.png' alt={""} width="256" height="256" />
          </ImageContainer>

          <div style={{display: "flex",flexDirection: "row"}}>
          
            <p style={{fontSize: 18, fontWeight: "bold"}}>{availableItems}</p>
            <p style={{fontSize: 18, fontWeight: "bold"}}>/7</p>
          
          </div>

          <p style={{fontWeight: 'bold', fontSize: 16}}>1 SOL for Mint</p>

          <MintButton
              disabled={isSoldOut || isMinting || !isActive}
              onClick={onMint}
              variant="contained"
              style={{backgroundColor: "slateblue", color: "white"}}
            >
              {isSoldOut ? (
                "SOLD OUT"
              ) : isActive ? (
                isMinting ? (
                  <CircularProgress />
                ) : (
                  "MINT"
                )
              ) : (
                <Countdown
                  date={startDate}
                  onMount={({ completed }) => completed && setIsActive(true)}
                  onComplete={() => setIsActive(true)}
                  renderer={renderCounter}
                />
              )}
          </MintButton>

        </MintContainer>}

        {wallet.connected &&
          <div style={{backgroundColor: '#D8C1FA'}}>

            <p style={{fontSize: 24, fontWeight: 'bold', color: 'slateblue',textAlign: 'center'}}>ROAD MAP</p>

            <RoadmapContainer>
              <div style={{flex: 10, flexDirection: 'column', textAlign: 'center'}}>
                <div style={{backgroundColor: 'slateblue',borderRadius: 15, height: 100,flex: 1, marginRight: 75, marginLeft: 75}}>
                  <p style={{marginLeft: 15, marginRight: 15,textAlign: 'justify',fontSize: 20, fontWeight: 'inherit',color: "white"}}>*******</p>
                </div>
                
                <div style={{height: 100,flex: 1, marginRight: 75, marginLeft: 75}}>
                  <p style={{marginLeft: 15, marginRight: 15,textAlign: 'justify',fontSize: 20, fontWeight: 'inherit',color: "white"}}></p>
                </div>
                
                <div style={{backgroundColor: 'slateblue',borderRadius: 15, height: 100,flex: 1, marginRight: 75, marginLeft: 75}}>
                  <p style={{marginLeft: 15, marginRight: 15,textAlign: 'justify',fontSize: 20, fontWeight: 'inherit',color: "white"}}>*******</p>
                </div>
                
              </div>
            
              <div style={{flex: 0.25, backgroundColor: 'darkgray', borderRadius: 5, height: 400}}>
              
              </div>
            
              <div style={{flex: 10}}>
                <div style={{height: 100,flex: 1, marginRight: 75, marginLeft: 75}}>
                  <p style={{marginLeft: 15, marginRight: 15,textAlign: 'justify',fontSize: 20, fontWeight: 'inherit',color: "white"}}></p>
                </div>
                
                <div style={{backgroundColor: 'slateblue',borderRadius: 15, height: 100,flex: 1, marginRight: 75, marginLeft: 75}}>
                  <p style={{marginLeft: 15, marginRight: 15,textAlign: 'justify',fontSize: 20, fontWeight: 'inherit',color: "white"}}>*******</p>
                </div>
                
                <div style={{height: 100,flex: 1, marginRight: 75, marginLeft: 75}}>
                  <p style={{marginLeft: 15, marginRight: 15,textAlign: 'justify',fontSize: 20, fontWeight: 'inherit',color: "white"}}></p>
                </div>
              
              </div>
          </RoadmapContainer>
        </div>
      }

      {wallet.connected &&
        <RarityContainer>
            <p style={{fontSize: 24, fontWeight: 'bold', color: 'slateblue',textAlign: 'center'}}>RARITY TABLE</p>

            <div style={{height: 500}}>

            </div>
        </RarityContainer>
      }

      <Snackbar
        open={alertState.open}
        autoHideDuration={6000}
        onClose={() => setAlertState({ ...alertState, open: false })}
      >
        <Alert
          onClose={() => setAlertState({ ...alertState, open: false })}
          severity={alertState.severity}
        >
          {alertState.message}
        </Alert>
      </Snackbar>
    </main>
  );
};

interface AlertState {
  open: boolean;
  message: string;
  severity: "success" | "info" | "warning" | "error" | undefined;
}

const renderCounter = ({ days, hours, minutes, seconds, completed }: any) => {
  return (
    <CounterText>
      {hours} hours, {minutes} minutes, {seconds} seconds
    </CounterText>
  );
};

export default Home;
