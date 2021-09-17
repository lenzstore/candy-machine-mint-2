import { useEffect, useState } from "react";
import styled from "styled-components";
import Countdown from "react-countdown";
import { Button, CircularProgress, Snackbar } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import { BrowserView, MobileView } from "react-device-detect";

import walletIcon from './svg/wallet-icon.svg';
import solanaIcon from './svg/solana-icon.svg';
import solanaHorizontal from './svg/solana-horizontal-gradient.png';
import twitterIcon from './svg/twitter-icon.svg';
import discordIcon from './svg/discord-icon.svg';
import siteIcon from './svg/site-icon.png';
import animatedCollection from './svg/animated-collection.gif';
import rarityTable from "./svg/rarity-table-browser.png";
import rarityTableMobile from "./svg/rarity-table-mobile.png";

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
  heigth: 20px;
  width: 170px;
  margin-right: 20px;`;

const CounterText = styled.span`
  color: white;`; // add your styles here

const NameHeader = styled.p`
font-size: 26px;
margin-left: 10px;
font-weight: bold;
background: -webkit-linear-gradient(#9548fd, #63f8c8);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;`;

const HeaderContainer = styled.div`
  display: flex;
  height: 120px;
  background-color: #1A1627;
  text-align: center;
  flex-direction: row;
  `;

const AccountContainer = styled.div`
  height: 85px;
  width: 185px;
  box-shadow: rgba(0, 0, 0, 0.56) 0px 22px 70px 4px; 
  display: flex;
  flex-direction: row;
  margin-right: 20px;
  margin-top: 10px;
  margin-bottom: 10px;
  text-align: left;
  background-color: #1A1627;
  border: 2px solid #1A1627;
  border-radius: 15px;`;

  
const MintContainer = styled.div`
  display: flex;
  height: 85vh;
  flex-direction: row;
  background: -webkit-linear-gradient(#1A1627 ,#9548fd, #3B9478);
  justify-content: center;
  align-items: center;
  box-shadow: rgb(149, 72, 252) 0px 0px 0px 3px;
  `;

const MobileMintContainer = styled.div`
  display: flex;
  height: 85vh;
  flex-direction: column;
  background: -webkit-linear-gradient(#1A1627 ,#9548fd, #3B9478);
  justify-content: center;
  align-items: center;
  box-shadow: rgb(149, 72, 252) 0px 0px 0px 3px;
  `;

const MintInformation = styled.div`
  display: flex;
  box-shadow: rgba(0, 0, 0, 0.56) 0px 22px 70px 4px;
  border-radius: 15px;
  background-color: #1A1627; 
  margin-left: 50px;
  text-align: left;
  width: 250px;
  align-items; center;
  justify-content: center;
  flex-direction: column;`;
  

const MintButton = styled(Button)`
  width: 125px;`;

const ImageContainer = styled.div`
  `;

const SocialButton = styled(Button)`
  background: white;
  width: 24px;
  heigth: 24px;
  border: none;
  outline: none;
  cursor: pointer;
  opacity: 1;`;

const RoadMapHeader = styled.div`
  display: flex;
  border-radius: 25px;
  box-shadow: rgba(0, 0, 0, 0.56) 0px 20px 50px 2px;
  background-color: #1A1627;
  text-align: left;
  width: 200px;
  text-align: center;
  flex-direction: column;
  `;

const RoadmapContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: -webkit-linear-gradient(#3B9478, #9548fd, #1A1627);
  justify-content: center;
  align-items: center;

  `;

const RoadmapBubbleContainer = styled.div`
  display: flex;
  flex: 1;
  width: 100%;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const RoadmapBubble = styled.div`
  background-color: #1A1627;
  border-radius: 15px;
  height: 100px;
  margin-left: 75px;
  margin-right: 75px;
  flex: 1;`;

const RoadMapPgraph = styled.p`
  margin-left: 15px;
  margin-right: 15px;
  text-align: justify;
  font-size: 20px;
  font-weight: inherit;
  color: white;`;

const RarityContainer = styled.div`
  display: flex;
  background: -webkit-linear-gradient(#1A1627 ,#9548fd, #3B9478);
  heigth: 1000px;
  justify-content: center;
  align-items: center;
  text-align: center;
  flex-direction: column;
  `;

const BottomContainer = styled.div`
  display: flex;
  background: -webkit-linear-gradient(#3B9478, #1A1627, black);
  justify-content: center;
  align-items: center;
  text-align: center;`;

const GIF = styled.img`
  display: block;
  margin-left: auto;
  margin-right: auto;
  margin-top: auto;
  margin-bottom: auto;
  box-shadow: rgba(6, 24, 44, 0.4) 0px 0px 0px 2px, rgba(6, 24, 44, 0.65) 
    0px 4px 6px -1px, rgba(255, 255, 255, 0.08) 0px 1px 0px inset;`;

const RarityTable = styled.img`
  display: block;
  margin-left: auto;
  margin-right: auto;
  margin-top: auto;
  margin-bottom: auto;
  box-shadow: rgba(6, 24, 44, 0.4) 0px 0px 0px 2px, rgba(6, 24, 44, 0.65) 
    0px 4px 6px -1px, rgba(255, 255, 255, 0.08) 0px 1px 0px inset;`;

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
  const [availableItems, setAvailable] = useState(0);
  const [reedemedItems, setRedeemed] = useState(0);
  const [width] = useState<number>(window.innerWidth);

  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });

  //const [startDate, setStartDate] = useState(new Date(props.startDate));

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

      const { candyMachine, goLiveDate, itemsRemaining, itemsAvailable, itemsRedeemed } =
        await getCandyMachineState(
          anchorWallet,
          props.candyMachineId,
          props.connection,
        );
      
      setRedeemed(itemsRedeemed);
      setAvailable(itemsAvailable );
      setIsSoldOut(itemsRemaining === 0);
      //setStartDate(goLiveDate);
      setCandyMachine(candyMachine);
    })();
  }, [wallet, props.candyMachineId, props.connection]);

  return (
    <>
      <BrowserView viewClassName="browser-class">
            <HeaderContainer>
                
                <div style={{flex: 6.7, flexDirection: "column", display: "flex", marginTop: 12}}>

                  <div style={{flexDirection: "row", display: "flex"}}>
                    <img className="siteIcon" src={siteIcon} alt="Site Icon" width="48" height="48" style={{marginLeft: 50, marginTop: 18}}/>
                    <NameHeader>NFTofas</NameHeader>
                  </div>

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
                
                {wallet.connected ?
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
                :
                <div style={{flex: 1, marginTop: 30, marginRight: 10}}>
                    <ConnectButton>Connect Wallet</ConnectButton>
                </div>
                }

            </HeaderContainer>

            <MintContainer>
              
              <ImageContainer>
                <GIF className="car" src={animatedCollection} alt="Collection" width="320" height="320" style={{borderRadius: 15}}></GIF>
              </ImageContainer>
              
              {wallet.connected ? 
              <MintInformation>
                <div style={{display: "flex",flexDirection: "row", justifyContent: "center", height: 50}}>
              
                  <p style={{fontSize: 20, color: "white"}}>{reedemedItems}/{availableItems}</p>
                  <p style={{fontSize: 20, color: "#7367e3"}}></p>
                
                </div>

                <div style={{display: "flex", justifyContent: "center", height: 75}}>
                  <p style={{fontSize: 20, color: "white"}}>Price: 1 <img src={solanaIcon} alt="Solana Icon" width= "15" height="15" style={{marginLeft: 5}}/></p>
                </div>

                <div style={{ height: 60}}>  
                  <MintButton
                    disabled={isSoldOut || isMinting || !isActive}
                    onClick={onMint}
                    variant="contained"
                    style={{backgroundColor: "slateblue", color: "white", marginLeft: 65}}
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
                        date={1631836860000}
                        //onTick={renderCounter}
                        onMount={({ completed }) => completed && setIsActive(true)}
                        onComplete={() => setIsActive(true)}
                        //renderer={renderCounter}
                      />
                    )}
                  </MintButton>
                </div>
              </MintInformation>
              
              :

              <MintInformation>
                <div style={{display: "flex",flexDirection: "row", justifyContent: "center", height: 50}}>
              
                  <p style={{fontSize: 20, fontWeight: "bold", color: "white"}}>Unlock Wallet</p>
                
                </div>

                <div style={{display: "flex", justifyContent: "center", height: 75}}>
                  <p style={{fontSize: 20, fontWeight: "bold", color: "white"}}>Price: 1 <img src={solanaIcon} alt="Solana Icon" width= "15" height="15" style={{marginLeft: 5}}/></p>
                </div>
              </MintInformation>
              }

            </MintContainer>


            <RoadmapContainer>

              <RoadMapHeader>
                <p style={{fontSize: 20, color: 'white'}}>ROAD MAP</p>
              </RoadMapHeader>

              <RoadmapBubbleContainer>
                <div style={{flex: 10, flexDirection: 'column', textAlign: 'center'}}>
                  <RoadmapBubble>
                    <RoadMapPgraph>****</RoadMapPgraph>
                  </RoadmapBubble>
                  
                  <div style={{height: 100, flex: 1, marginRight: 75, marginLeft: 75}}>
                    <p style={{marginLeft: 15, marginRight: 15,textAlign: 'justify',fontSize: 20, fontWeight: 'inherit',color: "white"}}></p>
                  </div>
                  
                  <RoadmapBubble>
                    <RoadMapPgraph>****</RoadMapPgraph>
                  </RoadmapBubble>
                  
                </div>
              
                <div style={{flex: 0.08, backgroundColor: 'white', borderRadius: 5, height: 400}}>
                
                </div>
              
                <div style={{flex: 10, flexDirection: "column"}}>
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
              </RoadmapBubbleContainer>
          </RoadmapContainer>

          <RarityContainer>
          
              <RarityTable src={rarityTable} alt="Rarity Table" style={{width: 977, height: 602, marginTop: 50, marginBottom: 50, borderRadius: 15}}></RarityTable>
          
          </RarityContainer>
            
          <BottomContainer style={{height: 75}}>
              
            <SocialButton onClick={(e) => {
              window.open("http://twitter.com/NFTofas", "_blank")
            }}>
              <img className="twitterButton" src={twitterIcon} 
                alt="Twitter" width="24" height="24"/>
            </SocialButton>
            
            <SocialButton onClick={(e) => {
              window.open("http://discord.com/", "_blank")
            }}>
              <img className="discordButton" src={discordIcon} 
                alt="Discord" width="24" height="24"/>
            </SocialButton>

            <img src={solanaHorizontal} alt="Solana Horizontal"  width="95.04" height="11.52" style={{marginLeft: 10}}/>
          
          </BottomContainer>

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
      </BrowserView>
    
      <MobileView viewClassName="mobile-class">
        
        <HeaderContainer>
          
          <div style={{flex: 6.7, flexDirection: "row", display: "flex", marginTop: 12}}>
            <img className="siteIcon" src={siteIcon} alt="Site Icon" width="48" height="48" style={{marginLeft: 15, marginTop: 18}}/>
            <NameHeader>NFTofas</NameHeader>
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

        </HeaderContainer>

        <MobileMintContainer>
          <ImageContainer>
            <GIF className="car" src={animatedCollection} alt="Collection" width="196" height="196" style={{borderRadius: 15}}></GIF>
          </ImageContainer>

          <MintInformation style={{width: 200, marginLeft: 0, marginTop: 15, height: 100}}>
            <div style={{display: "flex",flexDirection: "row", justifyContent: "center", height: 50}}>
              
              <p style={{fontSize: 14, fontWeight: "bold", color: "white"}}>Please use Web Browser for mint</p>
            
            </div>

            <div style={{display: "flex", justifyContent: "center", height: 75}}>
              
              <p style={{fontSize: 20, fontWeight: "bold", color: "white"}}>Price: 1 <img src={solanaIcon} alt="Solana Icon" width= "15" height="15" style={{marginLeft: 5}}/></p>
            
            </div>
          
          </MintInformation>
        
        </MobileMintContainer>

        <RoadmapContainer>
        
          <RoadMapHeader style={{marginBottom: 20, width: width/2.5}}>
            
            <p style={{fontSize: 18, color: 'white'}}>ROAD MAP</p>
          
          </RoadMapHeader>

          <RoadmapBubble style={{marginLeft: 0, marginRight: 0, width: width*4/5, marginBottom: 20,  borderRadius: 25}}>
        
            <RoadMapPgraph>***</RoadMapPgraph>
        
          </RoadmapBubble>
        
          <div style={{flex: 0.3, backgroundColor: 'white', borderRadius: 5}}>
                
          </div>

          <RoadmapBubble style={{marginLeft: 0, marginRight: 0, width: width*4/5, marginBottom: 20, borderRadius: 25}}>
          
            <RoadMapPgraph>***</RoadMapPgraph>
          
          </RoadmapBubble>

          <div style={{flex: 0.3, backgroundColor: 'white', borderRadius: 5}}>
                
          </div>

          <RoadmapBubble style={{marginLeft: 0, marginRight: 0, width: width*4/5, marginBottom: 20,  borderRadius: 25}}>
          
            <RoadMapPgraph>***</RoadMapPgraph>
          
          </RoadmapBubble>

          <div style={{flex: 0.3, backgroundColor: 'white', borderRadius: 5}}>
                
          </div>
        
        </RoadmapContainer>

        <RarityContainer style={{justifyContent: "flex-start", height: 350}}>
          
          <RarityTable src={rarityTableMobile} alt="Rarity Table" style={{width: width*4/5, height: width*2/3, marginTop: 10, borderRadius: 25}}></RarityTable>
          
        </RarityContainer>
        
      </MobileView>
    </>
  );
};

interface AlertState {
  open: boolean;
  message: string;
  severity: "success" | "info" | "warning" | "error" | undefined;
}

/*const renderCounter = ({ days, hours, minutes, seconds, completed }: any) => {
  return (
    <CounterText>
      {days*24+hours}:{minutes}:{seconds} {completed.toString()}
    </CounterText>
  );
};*/

export default Home;
