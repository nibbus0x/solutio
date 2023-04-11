import { MaterialCommunityIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { cancelPayment, PaymentType, updatePayment } from "@solutio/sdk";
import { BN } from "bn.js";
import { useState } from "react";
import { Button, Modal } from "react-native";
import { Text, TextInput, View } from "react-native";
import { Screen } from "../components/Screen";
import { useAnchorProgram, useSolanaProvider } from "../hooks/xnft-hooks";
import { signAndSendTransaction } from "../utils";
import { HomeStackParamList } from "../utils/navigators";
import { Formik } from "formik";

export const PaymentScreen = ({
  route,
}: NativeStackScreenProps<HomeStackParamList, "Payment">) => {
  const { payment } = route.params;
  const provider = useSolanaProvider();
  const program = useAnchorProgram();
  const [showUpdateModal, setShowUpadteModal] = useState(false);

  const cancelExistigPayment = async () => {
    if (!program || !provider) {
      console.log("Missing provider");
      return;
    }

    const ix = await cancelPayment(
      provider.wallet,
      payment.receiver,
      payment.mint,
      payment.threadId,
      program
    );

    const sig = await signAndSendTransaction([ix], provider);
    console.log(sig);
  };

  return (
    <Screen>
      <Modal visible={showUpdateModal} animationType="fade">
        <View className="mt-4 ml-4">
          <MaterialCommunityIcons
            name="close"
            size={25}
            onPress={() => {
              setShowUpadteModal(false);
            }}
          />
        </View>
        <View className="flex justify-center items-center h-5/6">
          <View className="w-3/4">
            <Formik
              initialValues={{
                newAmnt: 0,
                // schedule: ""
              }}
              onSubmit={async (vals) => {
                if (!program || !provider) {
                  console.log("Missing provider");
                  return;
                }

                const ix = await updatePayment(
                  provider.wallet,
                  payment.receiver,
                  payment.mint,
                  payment.threadId,
                  program,
                  vals.newAmnt > 0 ? new BN(vals.newAmnt) : null,
                  null // For now
                );

                const sig = await signAndSendTransaction([ix], provider);
                console.log(sig);
                setShowUpadteModal(false);
              }}
            >
              {(props) => (
                <View>
                  <View className="space-y-2 mb-4">
                    <TextInput
                      value={
                        props.values.newAmnt === 0
                          ? ""
                          : props.values.newAmnt.toString()
                      }
                      onChangeText={props.handleChange("newAmnt")}
                      placeholder="New Amount to Transfer"
                    />
                    {/* <TextInput value={} onChange={} Uncomment with release of recurring payments*/}
                  </View>
                  <Button onPress={props.handleSubmit} title={"Confirm"} />
                </View>
              )}
            </Formik>
          </View>
        </View>
      </Modal>
      <View>
        <View className="flex space-y-2 mb-4">
          <Text>Mint: {payment.mint.toBase58()}</Text>
          <Text>Receiver: {payment.receiver.toBase58()}</Text>
          <Text>Amount: {payment.amount.toNumber()}</Text>
          <Text>
            {payment.schedule.now ? "Now" : payment.schedule.cron?.scheduleStr}
          </Text>
          <Text>
            Status:{" "}
            {payment.status.active
              ? "Active"
              : payment.status.cancelled
              ? "Cancelled"
              : "Complete"}
          </Text>
        </View>
        <View className="flex flex-row justify-around">
          <Button
            onPress={() => {
              setShowUpadteModal(true);
            }}
            title={"Update"}
          />
          <Button onPress={cancelExistigPayment} title={"cancel"} />
        </View>
      </View>
    </Screen>
  );
};
