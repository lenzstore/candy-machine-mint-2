import { useEffect, useState } from "react";
import styled from "styled-components";
import Countdown from "react-countdown";
import { Button, CircularProgress, Snackbar } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import walletIcon from './svg/wallet-icon.svg';
import solanaIcon from './svg/solana-icon.svg';
import twitterIcon from './svg/twitter-icon.svg';
import discordIcon from './svg/discord-icon.svg';
import siteIcon from './svg/site-icon-white.svg';

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
  background-color: #1A1627;
  text-align: center;
  flex-direction: row`;

const AccountContainer = styled.div`
  width: 150px;
  box-shadow: 0px 1px 1px 1px; 
  display: flex;
  flex-direction: row;
  margin-right: 20px;
  margin-top: 10px;
  margin-bottom: 10px;
  text-align: center;
  background-color: #1A1627;
  border: 2px solid #1A1627;
  border-radius: 15px;`;

  
const MintContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 500px;
  background-color: #493D6E;
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
  background-color: #493D6E;
  flex-direction: row;`;

const RarityContainer = styled.div`
  display: flex;
  heigth: 500px;
  background-color: #493D6E;
  text-align: center;
  flex-direction: column;`;

const RoadmapBubble = styled.div`
  background-color: #1A1627;
  border-radius: 15px;
  height: 100px;
  flex: 1;
  margin-right: 75px;
  margin-left: 75px;`;

const RoadMapPgraph = styled.p`
  margin-left: 15px;
  margin-right: 15px;
  text-align: justify;
  font-size: 20px;
  font-weight: inherit;
  color: white;`;

const GIF = styled.img`
  display: block;
  margin-left: auto;
  margin-right: auto`;

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
    <main style={{backgroundColor: '#493D6E'}}>
      {wallet.connected &&
        <HeaderContainer>
            
            <div style={{flex: 6.7, flexDirection: "row", display: "flex", marginTop: 12}}>
              <img className="siteIcon" src={siteIcon} alt="Site Icon" width="48" height="48" style={{marginLeft: 60, marginTop: 18}}/>
              <p style={{color: "white", fontSize: 26, marginLeft: 20, fontWeight: 'bold'}}> NFTofas</p>
            </div>

            

            <div style={{flex: 0.15, flexDirection: "column", alignContent: 'center'}}>
              
              <div style={{marginTop: 25}}>
                <SocialButton onClick={(e) => {
                  window.open("http://twitter.com/NFTofas", "_blank")
                }}>
                  <img className="twitterButton" src={twitterIcon} 
                    alt="Twitter" width="24" height="24"/>
                </SocialButton>
              </div>

              <div>
                <SocialButton onClick={(e) => {
                  window.open("http://discord.com", "_blank")
                }}>
                  <img className="discordButton" src={discordIcon} 
                    alt="Discord" width="24" height="24"/>
                </SocialButton>
              </div>
              
            </div>

            <div style={{ flex: 1.2,display: "flex",textAlign: "right"}}>  
              <AccountContainer>

                <div style={{display: "flex", flexDirection: "column"}}>
                  <img src={walletIcon} alt="Wallet" height="20" width="20" style={{marginTop: 18, marginLeft: 12}}/>
                  <img src={solanaIcon} alt="Solana" height="20" width="20" style={{marginTop: 16, marginLeft: 12}}/>
                </div>

                <div style={{flexDirection:"column"}}>
                  <p style={{color: 'white', marginLeft: 10}}>{shortenAddress(wallet.publicKey?.toBase58() || "")}</p>
                
                  <p style={{color: 'white', marginLeft: 10}}>{(balance || 0).toLocaleString()} SOL</p>
                </div>
              </AccountContainer>
            </div>
        </HeaderContainer>}
      
        {!wallet.connected &&
          <div>
            <HeaderContainer>
              
              <div style={{flex: 6.7, flexDirection: "row", display: "flex"}}>
                <img className="siteIcon" src={siteIcon} alt="Site Icon" width="48" height="48" style={{marginLeft: 60, marginTop: 18}}/>
                <p style={{color: "white", fontSize: 26, marginLeft: 20, fontWeight: 'bold'}}> NFTofas</p>
              </div>

              <div style={{flex: 1, marginTop: 30, marginRight: 10}}>
                <ConnectButton>Connect Wallet</ConnectButton>
              </div>
            </HeaderContainer>

            <div style={{height: 1080}}>
              <div style={{flex: 0.5, textAlign: "center"}}>
                <p style={{fontSize: 30, color: "white"}}>Coming Soooon!</p>
              </div>

              <div>
                <GIF src={"https://c.tenor.com/himbGmuY4cgAAAAC/turtle-friends.gif"} alt="GIF"></GIF>
              </div>
            </div>
          
          </div>
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
          <div style={{backgroundColor: '#493D6E'}}>

            <p style={{fontSize: 24, fontWeight: 'bold', color: 'white',textAlign: 'center'}}>ROAD MAP</p>

            <RoadmapContainer>
              <div style={{flex: 10, flexDirection: 'column', textAlign: 'center'}}>
                <RoadmapBubble>
                  <RoadMapPgraph>****</RoadMapPgraph>
                </RoadmapBubble>
                
                <div style={{height: 100,flex: 1, marginRight: 75, marginLeft: 75}}>
                  <p style={{marginLeft: 15, marginRight: 15,textAlign: 'justify',fontSize: 20, fontWeight: 'inherit',color: "white"}}></p>
                </div>
                
                <RoadmapBubble>
                  <RoadMapPgraph>****</RoadMapPgraph>
                </RoadmapBubble>
                
              </div>
            
              <div style={{flex: 0.1, backgroundColor: 'white', borderRadius: 5, height: 400}}>
              
              </div>
            
              <div style={{flex: 10}}>
                <div style={{height: 100,flex: 1, marginRight: 75, marginLeft: 75}}>
                  <p style={{marginLeft: 15, marginRight: 15,textAlign: 'justify',fontSize: 20, fontWeight: 'inherit',color: "white"}}></p>
                </div>
                
                <RoadmapBubble>
                  <RoadMapPgraph>****</RoadMapPgraph>
                </RoadmapBubble>
                
                <div style={{height: 100,flex: 1, marginRight: 75, marginLeft: 75}}>
                  <p style={{marginLeft: 15, marginRight: 15,textAlign: 'justify',fontSize: 20, fontWeight: 'inherit',color: "white"}}></p>
                </div>
              
              </div>
          </RoadmapContainer>
        </div>
      }

      {wallet.connected &&
        <RarityContainer>
            <p style={{fontSize: 24, fontWeight: 'bold', color: 'white',textAlign: 'center'}}>RARITY TABLE</p>

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
